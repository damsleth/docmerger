/**
 * SFS OWA Proxy and PDF merger v1.0.
 * This app takes a list of pdfs, merges them and returns them as a single PDF to the client
 * This proxy is running on port 7001, and accepts POSTS to /getpdf with an object like this 
 * { documents:[{Title:string, Url:string:SpmNr:string}]}
 */

var fetch = require("node-fetch")
var fs = require("fs")
var express = require("express")
var PDFMerge = require("pdf-merge")
var app = express();
app.listen(process.env.PORT || 7002);
app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded({ extended: true }));

//If We're debugging, enable cors
if (process.env._system_name === "OSX") {
    var cors = require('cors');
    console.log(`Debugging, CORS enabled`)
    app.use(cors({
        'allowedHeaders': ['sessionId', 'Content-Type'],
        'exposedHeaders': ['sessionId'],
        'origin': '*',
        'methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
        'preflightContinue': false
    }));
}

fs.stat(__filename.split(/[\\/]/).pop(), (err, stat) => {
    console.log(`PDF merger up and running\nLast modified ${stat.mtime.toDateString()}`)
})

//temp dir environment variables differ across platforms
const SAVE_FOLDER = process.env.TEMP ? process.env.TEMP : process.env.TMPDIR

// Main endpoint that returns a merged PDF
app.use('/getpdf', (req, res) => {
    let d = (Object.keys(req.body).length > 0) ? req.body : req.query;
    //when no data is sent
    if (!Object.keys(d).length) { returnHTMLBlob(res, `Error: no POST data was sent`) } else {
        // when only one document is passed
        if (d.documents.length === 1) { return fetchSinglePdf(res, d.documents[0]) }

        MergePDFs(d.documents).then((buffer) => {
            res.writeHead(200, {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'filename=dokument.pdf',
                'Content-Length': buffer.length
            });
            res.end(buffer);
            // The document(s) are corrupt, or otherwise
        }).catch((err) => {
            // I'm a teapot :-)
            res.writeHead(418, {
                "Content-Type": "text/html"
            });
            res.end(`Det oppstod en feil ved generering av pdf-dokumentet. stacktrace: ${err}`)
        })
    }
});

function fetchSinglePdf(res, document) {
    fetch(document.Url).then(doc => {
        doc.arrayBuffer().then(data => {
            pdfData = new Buffer(data)
            res.writeHead(200, {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename=' + document.Title + '.pdf',
                'Content-Length': pdfData.length
            });
            res.end(pdfData);
        })
    })
}

async function MergePDFs(documents) {
    console.log(`Saving ${documents.length} documents to disk`)
    let pdfs = [];
    for (let i in documents) {
        let nr = parseInt(i,10) + 1
        let doc = documents[i]
        let pdf = await fetch(doc.Url)
        let data = await pdf.arrayBuffer()
        let title = doc.Title.replace(/ |-|\)|\(/g,"_").replace(/_+/g,"_")
        await writeFile(`${SAVE_FOLDER}/${title}.pdf`, new Buffer(data))
        console.log(`${nr}/${documents.length}: ${title} saved to disk`)
        pdfs.push({ path: `${SAVE_FOLDER}/${title}.pdf`, spmnr: doc.SpmNr })
    }
    console.log(`${documents.length} documents successfully saved`)

    // We could do sorting here too, but it's handled client side for simplicity
    // let sortedPdfs = pdfs.sort((a, b) => a.spmnr - b.spmnr).map(p => p.path)
    let sortedPdfs = pdfs.map(p => p.path)
    console.log(`Merging documents...`)

    return PDFMerge(sortedPdfs).then(buffer=>{
        if(buffer){console.log("Documents successfully merged, removing temp files")}
        RemoveTempFiles(pdfs)
        console.log(`Temp files deleted, returning merged pdf to user`)
        return buffer
    })
}

async function writeFile(path, data, opts = 'utf8') {
    new Promise((resolve, reject) => {
        fs.writeFile(path, data, opts, (err) => {
            if (err) reject(err)
            else resolve()
        })
    })
}

function RemoveTempFiles(tempFiles) {
    tempFiles.map(file => {
        fs.unlink(file.path, function (err) {
            if (err && err.code == 'ENOENT') {
                // file doesn't exist
                console.info(`File ${file.path} doesn't exist, won't remove it.`);
            } else if (err) {
                // other errors, e.g. maybe we don't have enough permission
                console.error(`Error occurred while trying to remove file ${file.path}`);
            } else {
                console.info(`Temp file ${file.path} deleted`);
            }
        });
    })
}

// Returns an html blob to the client, used for error messages and such
function returnHTMLBlob(res, htmlBlob) {
    res.send(`<html>
    <body style="font-family:Helvetica,Arial,Sans-Serif;max-width:50%;margin:20px 0 0 20px;">
    ${htmlBlob}
    </body></html>
    `)
}

// default root, display msg
app.use('/', (req, res) => {
    returnHTMLBlob(res, `
<h2>This is a pdf proxy API</h2>
<ul><li><b>usage:</b> /getpdf?[url] - returns a merged pdf from an array of document urls</li>`)
});