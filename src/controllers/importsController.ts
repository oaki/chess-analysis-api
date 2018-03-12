import {ParsePgn, IPosition} from "../models/ParsePgn";
import positionService from "../services/positionService";
import {getBasePath} from "../config";

const es = require('event-stream');
import * as fs from 'fs';
import {IWorkerResponse} from "../interfaces";

export class ImportsController {
    private getFileName(name: string) {

        const filename = name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
        const path = `${getBasePath()}/src/games/${filename}.pgn`;

        // if(fs.stat().isFile)
        return path;
    }

    public import(name: string) {

        let game: string = '';
        const file = this.getFileName(name);

        console.log('start stream');
        console.log('file', file);
        const stream = fs.createReadStream(file)
            .pipe(es.split())
            .pipe(es.mapSync(function (line) {

                    // pause the readstream
                    stream.pause();

                    // console.log('line', line);

                    if (line.indexOf('[Event') !== -1) {

                        console.log('memoryUsage', process.memoryUsage());
                        const conditionBeforeSave = (info: any): boolean => {
                            console.log('conditionBeforeSave->info', info);
                            if (info.onMove === 'w' && info.eloWhite > 3200) {
                                return true;
                            }

                            if (info.onMove === 'b' && info.eloBlack > 3200) {
                                return true;
                            }

                            return false;
                        };

                        const parser = new ParsePgn(game, conditionBeforeSave);
                        parser.parseContent().then(() => {
                            console.log('Parsed game', game, line);
                            game = `${line}\n`;
                            stream.resume();
                        });

                    } else {
                        game += `${line}\n`;
                        stream.resume();
                    }

                    // resume the readstream, possibly from a callback

                })
                    .on('error', function (err) {
                        console.log('Error while reading file.', err);
                    })
                    .on('end', function () {
                        console.log('Read entire file.')
                    })
            );
        console.log('after stream');

    }

}