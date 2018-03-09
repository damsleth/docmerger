var fetch = require("node-fetch")
var fs = require("fs")
var express = require('express')
var request = require('request')

var app = express();
app.use('/pdfproxy', function (req, res) {
    var url = req.url.replace('/?url=', '');
    req.pipe(request(url)).pipe(res);
});
app.listen(process.env.PORT || 7000);

function fetchPdf(url) {
    fetch(url).then(res => {
        res.arrayBuffer().then(data => {

            // TODO: Return file to user 

            // POC Saves file to disk.
            fs.appendFileSync("test.pdf", new Buffer(data))
        })
    })
}