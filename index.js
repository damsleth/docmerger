/**
 * SFS OWA Proxy and PDF merger v1.0.
 * This app takes a list of pdfs, merges them and returns them as a single PDF to the client
 * This proxy is running on port 7001, and accepts POSTS to /getpdf with an object like this 
 * { documents:[{Title:string, Url:string:SpmNr:string}]}
 * 
 * Last updated 8.5.2020 by @damsleth
 */

var fetch = require("node-fetch")
var fs = require("fs")
var express = require("express")
var PDFMerge = require("pdf-merge")
var app = express();
app.listen(process.env.PORT || 7002);
app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded({ extended: true }));

// If We're debugging, enable CORS, so we accept calls from anywhere.
// Debugging enabled on MacOS, aka darwin
if (process.platform === "darwin") {
    var cors = require('cors');
    console.log(`Debugging, CORS enabled`)
    app.use(cors({
        'allowedHeaders': ['sessionId', 'Content-Type'],
        'exposedHeaders': ['sessionId'],
        'origin': '*',
        'methods': 'GET,HEAD,POST,',
        'preflightContinue': false
    }));
}

// Log lastModifiedDate to console on startup.
fs.stat(__filename.split(/[\\/]/).pop(), (err, stat) => {
    console.log(`PDF merger up and running\nLast modified ${stat.mtime.toDateString()}`)
})

// Temp dir environment variables differ across platforms.
const SAVE_FOLDER = process.env.TEMP ? process.env.TEMP : process.env.TMPDIR

// Main endpoint that returns a merged PDF.
app.use('/getpdf', (req, res) => {
    try {
        let d = (Object.keys(req.body).length > 0) ? req.body : req.query;

        //When no data is sent, return error.
        if (!Object.keys(d).length) { returnHTMLBlob(res, `Error: no POST data was sent`) } else {

            MergePDFs(d.documents).then((buffer) => {
                res.writeHead(200, {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': 'filename=dokument.pdf',
                    'Content-Length': buffer.length
                });
                res.end(buffer);
                // The document(s) are corrupt, or otherwise
            })
        }
    } catch (err) {
        res.writeHead(500, {
            "Content-Type": "text/html"
        })
        res.end(`Det oppstod en feil ved generering av pdf-dokumentet (/getpdf try/catch). stacktrace: ${err}`)
    }
});

// Main MergePDF function.
// Ttakes an object with an array of { documents:[{Title:string, Url:string:SpmNr:string}] } as input.
async function MergePDFs(documents) {
    console.log(`Saving ${documents.length} documents to disk`)
    let pdfs = [];
    for (let i in documents) {
        let nr = parseInt(i, 10) + 1
        let doc = documents[i]
        let pdf = await fetch(doc.Url)
        let data = await pdf.arrayBuffer()
        // Files are saved to disk as 6 character (sometimes 5) random ASCII strings with .pdf extension
        // This is to avoid issues with special character filenames
        let title = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 6);
        await writeFile(`${SAVE_FOLDER}/${title}.pdf`, Buffer.from(data))
        console.log(`${nr}/${documents.length}: ${title} saved to disk. (Original title: "${doc.Title}")`)
        pdfs.push({ path: `${SAVE_FOLDER}/${title}.pdf`, spmnr: doc.SpmNr })
    }
    console.log(`${documents.length} documents successfully saved`)

    // We could do sorting here too, but it's handled client side for simplicity
    // let sortedPdfs = pdfs.sort((a, b) => a.spmnr - b.spmnr).map(p => p.path)
    let sortedPdfs = pdfs.map(p => p.path)
    console.log(`Merging documents...`)

    // Corner case where there's only one document to "merge".
    // We have to add a blank entry to avoid pdftk bombing with "You need at least two pdfs to merge"-warning.
    if (sortedPdfs.length === 1) { sortedPdfs.push(" ") }

    return PDFMerge(sortedPdfs).then(buffer => {
        if (buffer) { console.log("Documents successfully merged, removing temp files") }
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
                // File doesn't exist.
                console.info(`File ${file.path} doesn't exist, won't remove it.`);
            } else if (err) {
                // Other errors, e.g. maybe running user doesn't have permission to delete files on disk.
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

// Default root endpoint, display a message
app.use('/', (_req, res) => {
    returnHTMLBlob(res, `
<h2>This is a pdf proxy API</h2>
<ul><li><b>usage:</b> /getpdf?[url] - returns a merged pdf from an array of document urls</li>`)
});