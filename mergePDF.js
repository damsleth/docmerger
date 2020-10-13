const PDFMerge = require('pdf-merge')
const fs = require('fs')
const fetch = require('node-fetch')
const Utils = require('./utils')
const SAVE_FOLDER = process.env.TEMP ? process.env.TEMP : process.env.TMPDIR

module.exports = async function (documents) {

    console.log(`Saving ${documents.length} documents to disk`)
    let pdfs = []
    for (let i in documents) {
        let nr = parseInt(i, 10) + 1
        let doc = documents[i]
        let pdf = await fetch.default(doc.Url)
        let pdfBuffer = await pdf.arrayBuffer()
        let title = Utils.getRandomFilename() // generate random filename to avoid collisions
        await Utils.writeFile(`${SAVE_FOLDER}/${title}.pdf`, Buffer.from(pdfBuffer))
        console.log(`${nr}/${documents.length}: ${title} saved to disk. (Original title: "${doc.Title}")`)
        pdfs.push({ path: `${SAVE_FOLDER}/${title}.pdf`, spmnr: doc.SpmNr })
    }
    console.log(`${documents.length} documents successfully saved`)

    // We could do sorting here too, but it's handled client side for simplicity
    // let sortedPdfs = pdfs.sort((a, b) => a.spmnr - b.spmnr).map(p => p.path)
    let sortedPdfs = pdfs.map(p => p.path)
    console.log(`Merging documents...`)

    let buffer;
    // Corner case where there's only one document to "merge".
    // just get the buffer from the file on disk
    // fs.promises sometimes return a 502, so we're playing it safe using trad fs.readFile
    if (sortedPdfs.length === 1) {
        try {
            fs.readFile(sortedPdfs[0], function (err, data) {
                if (err) throw err
                buffer = data
            })
        }
        catch (err) { console.error(err) }
    } else {
        buffer = await PDFMerge(sortedPdfs);
        if (buffer) { console.log("Documents successfully merged, removing temp files"); }
        // Clean up
    }
    Utils.removeTempFiles(pdfs);
    console.log(`Temp files deleted, returning merged pdf to user`);
    return buffer;

}