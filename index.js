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
// TODO: Accept an array of document IDs, either in url (GET) or post-data (POST)

// HOW TO CALL THE ENDPOINT FROM CONSOLE 
// fetch(`http://192.168.24.206:7000/getpdf`,
// {
// method:"POST",
// headers:{"content-type":"application/json",
// body:{"url":"lol"}
// }})
// .then(res=>res.text().then(d=>console.log(d)))

// Main endpoint that returns a merged PDF
// SHOULD BE A POST
app.use('/getpdf', (req, res) => {
    let d = (Object.keys(req.body).length > 0) ? req.body : req.query;
    if (!Object.keys(d).length) { returnHTMLBlob(res, `Error: no POST data was sent`) } else {
        console.log(d)
        let FullPdfUrls = d.FullPdfUrls
        let WopiItemIds = d.WopiItemIds
        let OWAServerUrl = d.OWAServerUrl
        let WopiAccessToken = d.WopiAccessToken

        // For dev-testing
        if (FullPdfUrls) {
            let urls = []
            FullPdfUrls.length === 1 ? urls.push(FullPdfUrls) : urls = FullPdfUrls
            // GET FILES, PUT IN TMPDIR / TMP
            urls.map(url => {
                savePDFToDisk(url).then(() => {
                    console.log(`${url}
                    Saved to disk`);
                })
            })

            // PDFMerge(FullPdfUrls).then(buffer => {
            //     res.writeHead(200, {
            //         'Content-Type': 'application/pdf',
            //         'Content-Disposition': 'filename=output.pdf',
            //         'Content-Length': buffer.length
            //     });
            //     res.end(buffer);
            // }).catch((err) => returnHTMLBlob(res, `<h2>File not found</h2><b>stacktrace:</b><br>${err}`))
        } else {

        }


        // req.pipe(request(url)).pipe(res);

        // GET THAT PDF
        res.send(d)
    }
});

function savePDFToDisk(url) {
    return fetch(url).then(res => {
        res.arrayBuffer().then(data => {
            fs.appendFileSync("test.pdf", new Buffer(data))
        })
    })
}

// app.use('/getpdf', (req, res) => {
// var url = req.url.replace('/?url=', '')
// req.pipe(request(url)).pipe(res);
// });

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

// function fetchPdf(url) {
//     fetch(url).then(res => {
//         res.arrayBuffer().then(data => {
//             fs.appendFileSync("test.pdf", new Buffer(data))
//             pdfData = new Buffer(data)
//             res.writeHead(200, {
//                 'Content-Type': 'application/pdf',
//                 'Content-Disposition': 'attachment; filename=some_file.pdf',
//                 'Content-Length': data.length
//             });
//             res.send(pdfData);
//         })
//     })
// }

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