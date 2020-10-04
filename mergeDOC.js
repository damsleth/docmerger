const pandoc = require('./pandoc')
const fs = require('fs')
const fsasync = require("fs").promises
const SAVE_FOLDER = process.env.TEMP ? process.env.TEMP : process.env.TMPDIR // Temp dir environment variables differ across platforms.

module.exports = async function (documents) {

    // Takes an object with an array of { documents:[{Title:string, Url:string:SpmNr:string}] } as input.
    console.log(`Saving ${documents.length} documents to disk`)
    let docsToMerge = [];
    for (let i in documents) {
        let nr = parseInt(i, 10) + 1
        let doc = documents[i]
        let data = doc.Content // arraybuffer
        // Files are saved to disk as 6 character (sometimes 5) random ASCII strings with .docx extension, to avoid issues with special character filenames
        let title = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 6);
        await writeFile(`${SAVE_FOLDER}${title}.docx`, Buffer.from(data))
        console.log(`${nr}/${documents.length}: ${title} saved to disk. (Original title: "${doc.Title}")`)
        docsToMerge.push({ path: `${SAVE_FOLDER}${title}.docx`, spmnr: doc.SpmNr })
    }
    console.log(`${documents.length} documents successfully saved`)

    // We could do sorting here too, but it's handled client side for simplicity
    // let sortedPdfs = pdfs.sort((a, b) => a.spmnr - b.spmnr).map(p => p.path)
    let sortedDocs = docsToMerge.map(p => p.path)
    console.log(`Merging documents...`)

    let src = sortedDocs.join(" ")
    console.log(`MERGING ${sortedDocs.join("\n")}`)
    let mergedFilename = `${SAVE_FOLDER}${new Date().getTime()}.docx` // getTime() to avoid filename collisions
    let params = `--track-changes=all --output ${mergedFilename}`
    await pandoc(`${src} ${params}`)
    RemoveTempFiles(docsToMerge)
    return getMergedDocument(mergedFilename).then(buffer => buffer)
}

async function getMergedDocument(filename) {
    const data = await fsasync.readFile(filename)
    return Buffer.from(data)
}

// ################ convenience methods #####################3


async function writeFile(path, data, opts = 'utf8') {
    new Promise((resolve, reject) => {
        fs.writeFile(path, data, opts, (err) => {
            if (err) reject(err)
            else resolve()
        })
    })
}

function RemoveTempFiles(tempFiles) {
    tempFiles.map(file => {
        fs.unlink(file.path, function (err) {
            if (err && err.code == 'ENOENT') {
                // File doesn't exist.
                console.info(`File ${file.path} doesn't exist, won't remove it.`);
            } else if (err) {
                // Other errors, e.g. maybe running user doesn't have permission to delete files on disk.
                console.error(`Error occurred while trying to remove file ${file.path}`);
            } else {
                console.info(`Temp file ${file.path} deleted`);
            }
        });
    })
}