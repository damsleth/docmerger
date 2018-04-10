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

# Install as a windows service
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

# Uninstall windows service
```
svc.on('uninstall',function(){
  console.log('Uninstall complete.');
  console.log('The service exists: ',svc.exists);
});
svc.uninstall();
```


## maintainers
DSS-Team, mainly @damsleth
