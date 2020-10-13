const fsasync = require("fs").promises
const pandoc = require('./pandoc')
const Utils = require('./utils')
const SAVE_FOLDER = process.env.TEMP ? process.env.TEMP : process.env.TMPDIR // Temp dir environment variables differ across platforms.

module.exports = async function (documents, trackchanges = false) {
    try {
        // Takes an object with an array of { documents:[{Title:<string>, Url:<string>, Content:<ArrayBuffer>}] } as input.
        console.log(`Saving ${documents.length} documents to disk`)
        console.log(`Tracked changes are ${trackchanges ? `enabled` : `disabled`}`)
        let docsToMerge = [];
        for (let i in documents) {
            let nr = parseInt(i, 10) + 1
            let doc = documents[i]
            let data = doc.Content // arraybuffer
            let title = Utils.getRandomFilename()
            await Utils.writeFile(`${SAVE_FOLDER}${title}.docx`, Buffer.from(data))
            console.log(`${nr}/${documents.length}: ${title} saved to disk. (Original title: "${doc.Title}")`)
            docsToMerge.push({ path: `${SAVE_FOLDER}${title}.docx`, spmnr: doc.SpmNr })
        }
        console.log(`${documents.length} documents successfully saved`)

        // We could do sorting here too, but it's handled client side for simplicity
        // let sortedPdfs = pdfs.sort((a, b) => a.spmnr - b.spmnr).map(p => p.path)
        let sortedDocs = docsToMerge.map(p => p.path)
        let src = sortedDocs.join(" ")
        let trackChangesParam = trackchanges ? "all" : "accept";
        let mergedFilename = `${SAVE_FOLDER}${new Date().getTime()}.docx` // getTime() to avoid filename collisions
        let params = `--track-changes=${trackChangesParam} --output ${mergedFilename}`
        console.log(`Merging documents...`)
        console.log(`MERGING ${sortedDocs.join("\n")}`)
        // call pandoc, merge document
        await pandoc(`${src} ${params}`)
        // Add merged file to list of files, for deletion
        docsToMerge.push({ path: mergedFilename })
        let tempFiles = docsToMerge
        // Pass buffer and documents to be deleted back to main function
        return getMergedDocument(mergedFilename).then(buffer => [buffer, tempFiles])
    }
    catch (err) {
        console.error(err)
    }
}

async function getMergedDocument(filename) {
    const data = await fsasync.readFile(filename)
    return Buffer.from(data)
}