const { spawn } = require('child_process');

module.exports = function () {

    var args = Array.prototype.slice.call(arguments)
    var result = "";
    return new Promise((resolve, reject) => {
        args = args[0].split(" ")
        const pandoc = spawn('pandoc', args);
        console.log("PANDOC SPAWNED WITH ARGS:")
        console.log(args)

        // ONLY USED WHEN --output is not defined
        // when not outputting to file, we get a Buffer (ArrayBuffer?) to stdout
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
            // callback(null, result || true);
        })

        // this does not get called?
        pandoc.on('end', () => {
            console.log("ON.END CALLED, THIS IS WEIRD, processing callback")
            resolve(result || true)
            // callback(null, result || true);
        })
    })
}
