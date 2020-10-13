const PDFMerge = require('pdf-merge')
const fetch = require('node-fetch')
const Utils = require('./utils')
const SAVE_FOLDER = process.env.TEMP ? process.env.TEMP : process.env.TMPDIR

module.exports = async function (documents) {
    try {
        documents.length === 1
            ? console.log(`Single pdf requested (ekspedering?)\nReturning the buffer without saving to disk`)
            : console.log(`Saving ${documents.length} documents to disk`)
        let pdfs = []
        for (let i in documents) {
            let nr = parseInt(i, 10) + 1
            let doc = documents[i]
            let pdf = await fetch.default(doc.Url)
            let pdfBuffer = await pdf.arrayBuffer()
            if (documents.length === 1) { // Corner case where there's only one document to "merge".
                return Buffer.from(pdfBuffer)
            }
            let title = Utils.getRandomFilename() // generate random filename to avoid collisions'
            await Utils.writeFile(`${SAVE_FOLDER}/${title}.pdf`, Buffer.from(pdfBuffer))
            console.log(`${nr}/${documents.length}: ${title} saved to disk. (Original title: "${doc.Title}")`)
            pdfs.push({ path: `${SAVE_FOLDER}/${title}.pdf`, spmnr: doc.SpmNr })
        }
        console.log(`${documents.length} documents successfully saved`)

        let sortedPdfs = pdfs.map(p => p.path) // Sorting is handled client side for simplicity
        console.log(`Merging documents...`)
        const buffer = await PDFMerge(sortedPdfs);
        console.log("Documents successfully merged, removing temp files");
        Utils.removeTempFiles(pdfs); // Clean up
        return buffer;
    }
    catch (err) {
        console.error(err)
    }
}
