# DSS-OWAPROXY

node.js (express) server acting as middleware between the client and OWA/WOPI/Word Automation Services, providing pdf and docx merge functionality using [pandoc](https://pandoc.org/) and [PDFtk](https://www.pdflabs.com/tools/pdftk-server/).

Supports merging Docx and PDF documents, though not both simultaneously.

## Usage

Pass an object, either 
* `{documents:[{Title:<string>,Url:<string-to-pdf>}]}` to the `/getpdf`-endpoint to return a PDF or 
* `{documents:[{Title:<string>,Url:<string>,Content:<ArrayBuffer>}]}` to the `/getdoc`-endpoint to return a docx

These are used by the `Last ned samlet PDF` and `Last ned samlet Docx` User Custom Actions

## Prerequisites / Dependencies

* nodejs LTS >=8 installed on machine running the server
    * express
    * node-fetch
    * nodemon (for dev-purposes)
* [pandoc](https://pandoc.org/) - for docx merging
* [PDFtk](https://www.pdflabs.com/tools/pdftk-server/) - for pdf merging

## Installation

* Win: 
  * Download and install PDFtk from https://www.pdflabs.com/tools/pdftk-the-pdf-toolkit/
  * Download pandoc (msi installer or executable as .zip) from https://github.com/jgm/pandoc/releases/tag/2.10.1
* MacOS:
  * brew install https://raw.githubusercontent.com/turforlag/homebrew-cervezas/master/pdftk.rb
  * brew install pandoc
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
  name:'sfsowaproxy',
  description: 'SFS Office Webapps Proxy for PDF merging',
  script: 'M:\\code\\dss-owaproxy\\index.js',
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

DSS-Team, mainly @damsleth
