# DSS-PDFPROXY

A simple node.js proxy server, acting as middleware between the client and OWA/WOPI/Word Automation Services.

## Usage
Pass a url to a pdf to the server, and it will return the PDF to the user, bypassing CORS

## Prerequisites / Dependencies
* nodejs v.8.9.4 (LTS) installed on machine running the server
    * express
    * node-fetch
    * nodemon (for dev-purposes)
* PDFtk - for merging PDFs.

## Installation
* Win: Download and install PDFtk from https://www.pdflabs.com/tools/pdftk-the-pdf-toolkit/
* MacOS: brew install https://raw.githubusercontent.com/turforlag/homebrew-cervezas/master/pdftk.rb
* npm install
* node index.js


## maintainers
DSS-Team, mainly @damsleth
