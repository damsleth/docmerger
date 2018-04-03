var fetch = require("node-fetch")
var fs = require("fs")
var express = require("express")
var PDFMerge = require("pdf-merge")
var app = express();
app.listen(process.env.PORT || 7002);
app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded({ extended: true }));
console.log(`PDF merger up and running`)

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
                'Content-Disposition': 'attachment; filename=' + document.title + '.pdf',
                'Content-Length': pdfData.length
            });
            res.end(pdfData);
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

async function MergePDFs(documents) {
    console.log("merging documents, please stand by")
    let pdfs = [];
    for (let i in documents) {
        let doc = documents[i]
        console.log(`fetching ${doc.Url}`)
        let pdf = await fetch(doc.Url)
        let data = await pdf.arrayBuffer()
        await writeFile(`${SAVE_FOLDER}/${doc.Title}.pdf`, new Buffer(data))
        console.log("saved " + doc.Title + " to disk")
        pdfs.push({ path: `${SAVE_FOLDER}/${doc.Title}.pdf`, spmnr: doc.SpmNr })
    }
    let sortedPdfPathArr = pdfs.sort((a, b) => a.spmnr - b.spmnr)
    let pdfBuffer = await PDFMerge(sortedPdfPathArr, {})
    RemoveTempFiles(pdfs)
    return pdfBuffer
}

async function writeFile(path, data, opts = 'utf8') {
    new Promise((resolve, reject) => {
        fs.writeFile(path, data, opts, (err) => {
            if (err) reject(err)
            else resolve()
        })
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