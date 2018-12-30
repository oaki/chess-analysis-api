import * as fs from "fs";

const es = require("event-stream");

export function pgnFileReader(filename: string, cb) {
    let game: string = "";
    let count = 0;


    const parseContent = es.mapSync(function (line) {
        // pause the readstream
        stream.pause();

        if (line.indexOf("[Event \"") !== -1 && count > 0) {

            cb(game).then(() => {
                game = line + "\n";
                stream.resume();
            });

        } else {
            game += `${line}\n`;
            stream.resume();
        }

        count++;
    })
        .on("error", function (err) {
            console.log("Error while reading file.", err);
        })
        .on("end", function () {
            cb(game);
            console.log("Read entire file.")
        });

    const stream = fs.createReadStream(filename)
        .pipe(es.split())
        .pipe(parseContent);
}
