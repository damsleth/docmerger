# DOCMERGER

DocMerger is a node.js express server acting as middleware between the client and Office Online Server / WOPI / Word Automation Services, providing pdf and docx merge functionality using [pandoc](https://pandoc.org/) for docx and [PDFtk](https://www.pdflabs.com/tools/pdftk-server/) for PDFs.

It can also be used as a generic pdf / doc merger, accepting any url as POST-input (see Usage).

Supports merging Docx and PDF documents, though not both simultaneously.
Tested on premises, but will probably work in an azure environment as well

## Usage

Pass an object to either the `/getpdf` or `/getdoc` endpoints 
* `/getpdf` - `{documents:[{Title:<string>,Url:<url-to-pdf>}]}` returns a PDF 
* `/getdoc` - `{documents:[{Title:<string>,Url:<string>,Content:<ArrayBuffer>}]}` returns a docx

### Starting the server
`node ./index.js` will start the server on localhost:7002 by default

### Browser console example
(with docmerger running on localhost:7002)
```
// using the getpdf-endpoint
let pdfblob = await fetch('http://localhost:7002/getpdf',{
method:'POST',
headers: {
    'Content-Type': 'application/json', 
    accept:'application/pdf'
    },
body:JSON.stringify(
    {
        documents:[
        {Title:"first",Url:"<url-to-a-pdf>"},
        {Title:"second",Url:"<url-to-another-pdf>"}]
    })
    // returning a blob from the fetch request
}).then(p=>p.blob().then(r=>r))

// Faking a link with the blob as contents and downloading it
// Simple example below, works in chromium.
blobObj = window.URL.createObjectURL(pdfblob)
            let link = document.createElement("a");
            link.href = blobObj;
            link.download = `mydoc.pdf`;
            link.click();
```


## Prerequisites / Dependencies

* nodejs LTS >=10 installed on machine running the server, with the following packages
    * express
    * node-fetch
    * pdf-merge
    * nodemon (dev only)
    * cors (dev only)
* [pandoc](https://pandoc.org/) - for docx merging
* [PDFtk](https://www.pdflabs.com/tools/pdftk-server/) - for pdf merging

## Installation

* Win: 
  * Download and install PDFtk from https://www.pdflabs.com/tools/pdftk-the-pdf-toolkit/
  * Download pandoc (msi installer or executable as .zip) from https://github.com/jgm/pandoc/releases/tag/2.10.1
* MacOS:
  * install pdftk with `brew install https://raw.githubusercontent.com/turforlag/homebrew-cervezas/master/pdftk.rb`
  * install pandoc with `brew install pandoc`
* npm install
* node index.js

## Install as a windows service

At commandline

```
npm install -g node-windows
npm link node-windows
```

in node repl

```
var Service = require('node-windows').Service;

var svc = new Service({
  name:'docmerger',
  description: 'Office Webapps Proxy for PDF merging',
  script: 'M:\\code\\docmerger\\index.js',
env: {
    name: "TEMP",
    value: process.env["TEMP"] // service is now able to access the user who created its' home directory
  }
});

svc.on('install',function(){
      svc.start();
});

svc.install();
```

## Uninstall windows service

```
svc.on('uninstall',function(){
  console.log('Uninstall complete.');
  console.log('The service exists: ',svc.exists);
});
svc.uninstall();
```

## maintainers

[@damsleth](https://github.com/damsleth)
