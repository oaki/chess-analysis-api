import * as fs from "fs";
import {getBasePath} from "../config";

const es = require("event-stream");

export function getFileName(name: string) {
    const filename = name;//.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
    return `${getBasePath()}/src/games/${filename}.pgn`;
}

export function pgnFileReader(name: string, cb) {
    let game: string = "";
    let count = 0;
    const file = this.getFileName(name);

    console.log("start stream");
    console.log("File name", file);

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

    const stream = fs.createReadStream(file)
        .pipe(es.split())
        .pipe(parseContent);
}
