/**
 * node.js wrapper for pandoc CLI.
 * The node-pandoc wrapper available on npmjs.org does not support more than one document, 
 * i.e. you can't merge with it
 * So I wrote this instead, which pretty naively just eats the arguments you pass it.
 * You have to keep track of things like filename and error handling yourself
 * as the function itself only returns true or false, and logs to the console
 * 
 * Last updated 04.10.2020 by @damsleth
 */


const { spawn } = require('child_process');

module.exports = function () {

    var args = Array.prototype.slice.call(arguments)
    var result = "";
    return new Promise((resolve, reject) => {
        args = args[0].split(" ")
        const pandoc = spawn('pandoc', args);
        console.log("PANDOC SPAWNED WITH ARGS:")
        console.log(args)

        // Only used when --output is not defined
        // when not outputting to file, we get a buffer (probably not a regular old arraybuffer though) to stdout
        // could potentially pipe it straight from here back to the client
        // but having it on disk is allright for debug purposes
        pandoc.stdout.on('data', (data) => {
            console.log("GOT DATA, PROCESSING")
            console.log("DATA:")
            console.log(data)
            result += data; // this is stupid
        });

        // error
        pandoc.stderr.on('data', (data) => {
            console.log("THATS AN ERROR")
            console.error(`stderr: ${data}`);
            reject(data)
        });

        // finished
        pandoc.on('close', (code) => {
            if (code === 0) { console.log(`pandoc done converting, returning`); }
            else { console.log(`child process exited with code ${code}`); }
            resolve(result || true)
        })

        // this does not get called. "close" comes before "end", and close resolves
        // TODO: delete
        pandoc.on('end', () => {
            console.log("ON.END CALLED, THIS IS WEIRD, processing callback")
            resolve(result || true)
        })
    })
}
