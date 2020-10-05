const fs = require('fs')

async function writeFile(path, data, opts = 'utf8') {
    new Promise((resolve, reject) => {
        fs.writeFile(path, data, opts, (err) => {
            if (err) reject(err)
            else resolve()
        })
    })
}

function removeTempFiles(tempFiles) {
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

function getRandomFilename() {
    return Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 6);
}

module.exports = { getRandomFilename, removeTempFiles, writeFile }