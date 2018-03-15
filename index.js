var fetch = require("node-fetch")
var fs = require("fs")
var express = require("express")
var request = require("request")
var PDFMerge = require("pdf-merge")
var app = express();
app.listen(process.env.PORT || 7000);
app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded({ extended: true }));
// TODO: limit proxy requests to current top-level-domain only, to avoid proxy exploitation
// TODO: UI Stuff

async function writeFile(path, data, opts = 'utf8') {
    new Promise((res, rej) => {
        fs.writeFile(path, data, opts, (err) => {
            if (err) rej(err)
            else res()
        })
    })
}

const SAVE_FOLDER = process.env.TEMP ? process.env.TEMP : process.env.TMPDIR
// Main endpoint that returns a merged PDF
app.use('/getpdf', (req, res) => {
    let d = (Object.keys(req.body).length > 0) ? req.body : req.query;
    if (!Object.keys(d).length) { returnHTMLBlob(res, `Error: no POST data was sent`) } else {
        mergePDFs(d.documents).then((buffer) => {
            res.writeHead(200, {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'filename=merged.pdf',
                'Content-Length': buffer.length
            });
            res.end(buffer);
        })
    }
});

async function mergePDFs(documents) {
    console.log("merging documents, please stand by")
    let pdfPathArr = [];
    for (let i in documents) {
        let doc = documents[i]
        let pdf = await fetch(doc.pdfUrl)
        let data = await pdf.arrayBuffer()
        await writeFile(`${SAVE_FOLDER}${doc.title}.pdf`, new Buffer(data))
        console.log("saved " + doc.title + " to disk")
        pdfPathArr.push(`${SAVE_FOLDER}${doc.title}.pdf`)
    }
    return await PDFMerge(pdfPathArr)
}

// Fetches pdfs from the local (server) filesystem.
// used for dev, not production
app.use('/getlocalpdf', (req, res) => {
    var files = req.url.replace('/?files=', '');
    let filesArr = files.split(",");
    PDFMerge(filesArr).then((buffer) => {
        res.writeHead(200, {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'filename=output.pdf',
            'Content-Length': buffer.length
        });
        res.end(buffer);
    }).catch((err) => returnHTMLBlob(res, `<h2>File not found</h2><b>stacktrace:</b><br>${err}`))
});


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
<ul><li>/getpdf?[url] - returns a merged pdf from a set of OWA document IDs</li>
<li>/getlocalpdf?[url] - merge and return pdfs from the server filesystem - <b>dev only</b></li>
`)
});