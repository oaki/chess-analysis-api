import * as fs from "fs";
import {logger} from "./logger";

const es = require("event-stream");

export function pgnFileReader(filename: string, cb) {
    let game: string = "";
    let count = 0;

    const parseContent = es.mapSync(function (line) {
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
            logger.error({err, filename}, "error reading PGN file");
        })
        .on("end", function () {
            cb(game);
            logger.debug({filename}, "finished reading PGN file");
        });

    const stream = fs.createReadStream(filename)
        .pipe(es.split())
        .pipe(parseContent);
}
