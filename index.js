/**
 * SFS OWA Proxy and PDF merger v1.5.
 * This app takes a list of pdfs or docxes, merges them and returns them as a single pdf or docx to the client
 * This proxy is running on port 7001, and accepts POSTS to /getpdf and /getdoc with an object like this 
 * /getpdf: { documents:[{Title:string, Url:string, SpmNr:string}]} - same structure as previous version to ensure backwards compatibility
 * /getdoc: {format: docx||pdf||markdown||whatever, documents:[{Title:string, Url:string, Body:ArrayBuffer}]} - sharepoint docxes don't have a public url like pdfs, so we have to pass the doc data
 * 
 * Last updated 4.10.2020 by @damsleth
 */

const fs = require("fs")
const express = require("express")
const mergePDF = require("./mergePDF")
const mergeDOC = require("./mergeDOC")
const Utils = require("./utils")
const app = express()
const cors = require('cors')
app.listen(process.env.PORT || 7002)
app.use(express.json({ limit: "50mb" }))       // to support JSON-encoded bodies
app.use(express.urlencoded({ extended: true, limit: "50mb" })) // big limit so we can pass big bodies

// If We're debugging, enable CORS, so we accept calls from anywhere.
// Debugging is auto enabled on MacOS, aka darwin
if (process.platform === "darwin") {
    console.log(`Debugging, CORS enabled`)
    app.use(cors({
        'allowedHeaders': ['sessionId', 'Content-Type'],
        'exposedHeaders': ['sessionId'],
        'origin': '*',
        'methods': 'GET,HEAD,POST,',
        'preflightContinue': false
    }));
}

// Temp dir environment variables differ across platforms.
const SAVE_FOLDER = process.env.TEMP ? process.env.TEMP : process.env.TMPDIR

// Log lastModifiedDate to console on startup.
fs.stat(__filename.split(/[\\/]/).pop(), (err, stat) => {
    console.log(`Document merger up and running\nLast modified ${stat.mtime.toDateString()}\nTemp folder: ${SAVE_FOLDER}`)
})


// endpoint that returns a merged PDF.
app.use('/getpdf', (req, res) => {
    console.log("/getpdf endpoint called")
    try {
        let body = (Object.keys(req.body).length > 0) ? req.body : req.query;
        //When no data is sent, return error.
        if (!Object.keys(body).length) {
            console.log(`Error: no POST data was sent`)
            returnHTMLBlob(res, `Error: no POST data was sent`)
            return res.end()
        }

        // Merge function that uses PDFtk
        mergePDF(body.documents).then((buffer) => {
            res.writeHead(200, {
                'Content-Type': 'application/pdf',
                'Content-Length': buffer.length
            });
            res.end(buffer);
            // The document(s) are corrupt, or otherwise
        })
    } catch (err) {
        console.error("ERROR IN PDFMERGER")
        console.error(err)
        res.writeHead(500, { "Content-Type": "text/html" })
        res.end(`Det oppstod en feil ved generering av pdf-dokumentet (/getpdf try/catch).\nstacktrace:\n${err}`)
    }
});


// endpoint that returns a merged DOCX.
// main difference is the POST request contains arraybuffers of each document in addition to urls and titles
app.use('/getdoc', (req, res) => {
    console.log("/getdoc endpoint called")
    try {
        let body = (Object.keys(req.body).length > 0) ? req.body : req.query;
        if (!Object.keys(body).length) {
            console.log(`Error: no POST data was sent`)
            returnHTMLBlob(res, `Error: no POST data was sent`)
            return res.end()
        }

        // Logging the documents to be merged before running pandoc
        body.documents.forEach(doc => {
            console.log(`Title: ${doc.Title}`)
            console.log(`Url: ${doc.Url}`)
        });

        let trackChanges = body.trackchanges ? true : false;
        // Calls the mergeDOC aka pandoc feature
        mergeDOC(body.documents, trackChanges).then((cb) => {
            let buffer = cb[0]
            let tempfiles = cb[1]
            res.writeHead(200, {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Length': buffer.length
            });
            res.end(buffer);
            Utils.removeTempFiles(tempfiles)
        })


    } catch (err) {
        console.error("ERROR IN DOCMERGER")
        console.error(err)
        res.writeHead(500, { "Content-Type": "text/html" })
        res.end(`Det oppstod en feil ved generering av docx-dokumentet (/getdoc try/catch).\nstacktrace:\n${err}`)
    }
})

// Returns an html blob to the client, used for error messages and such
function returnHTMLBlob(res, htmlBlob) {
    res.send(`<html><body style="font-family:Helvetica,Arial,Sans-Serif;max-width:80%;margin:20px 0 0 20px;">${htmlBlob}</body></html>`)
}

// Default root endpoint, display a message
app.use('/', (_req, res) => {
    returnHTMLBlob(res, `
<h2>This is a pdf proxy API</h2>
<ul><b>usage:</b><br/><br/>
<li><b>/getpdf</b>:   { documents: [ {Title:string, Url:string, SpmNr:string} ] } - same structure as previous version to ensure backwards compatibility</li><br/>
<li><b>/getdoc</b>: { documents: [ {Title:string, Url:string, Body:ArrayBuffer} ] } - sharepoint docxes don't have a public url like pdfs, so you need to pass the document as an arraybuffer</li> 
</ul>`)
});