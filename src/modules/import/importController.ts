import {ParsePgn} from "../../models/ParsePgn";
import {getBasePath} from "../../config/index";

const es = require('event-stream');
import * as fs from 'fs';
import {models} from "../../models/database";


export class ImportsController {
    private parser;

    constructor() {
        this.parser = new ParsePgn();
    }


    public loadFile(name: string, cb) {
        let game: string = '';
        let count = 0;
        const file = this.getFileName(name);

        console.log('start stream');
        console.log('File name', file);

        const stream = fs.createReadStream(file)
            .pipe(es.split())
            .pipe(es.mapSync(function (line) {
                    // pause the readstream
                    stream.pause();

                    if (line.indexOf('[Event "') !== -1 && count > 0) {

                        cb(game).then(() => {
                            game = line + '\n';
                            stream.resume();
                        });


                        //
                        //     .then(() => {
                        //     console.log('Parsed game', game, line);
                        //     game = `${line}\n`;
                        //     stream.resume();
                        // });

                    } else {
                        game += `${line}\n`;
                        stream.resume();
                    }

                    count++;

                    // resume the readstream, possibly from a callback

                })
                    .on('error', function (err) {
                        console.log('Error while reading file.', err);
                    })
                    .on('end', function () {
                        cb(game);
                        console.log('Read entire file.')
                    })
            );
    }

    private getFileName(name: string) {
        const filename = name;//.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
        return `${getBasePath()}/src/games/${filename}.pgn`;
    }

    public async importToMysql(game: string) {
        console.log('GAME', game);
        const parsedGame = this.parser.parsePgnWithJson(game);

        const values = {
            event: parsedGame.meta.event,
            opening: parsedGame.meta.opening,
            event_date: parsedGame.meta.eventDate,
            white_name: parsedGame.meta.whiteName,
            black_name: parsedGame.meta.blackName,
            result: parsedGame.meta.result,
            black_elo: parsedGame.meta.blackElo,
            white_elo: parsedGame.meta.whiteElo,
            moves: JSON.stringify(parsedGame.moves),
            isParsed: false
        };
        console.log('toMySql', values);
        await models.ImportGame.create(values);
    }

    public async importToMysql2(game: string) {
        console.log('GAME', game);
        const parsedGame = this.parser.parsePgnWithJson(game);

        const values = {
            event: parsedGame.meta.event,
            opening: parsedGame.meta.opening,
            event_date: parsedGame.meta.eventDate,
            white_name: parsedGame.meta.whiteName,
            black_name: parsedGame.meta.blackName,
            result: parsedGame.meta.result,
            black_elo: parsedGame.meta.blackElo,
            white_elo: parsedGame.meta.whiteElo,
            moves: JSON.stringify(parsedGame.moves)
        };
        console.log('toMySql', values);
        await models.ImportGame.create(values);
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

                        // const parser = new ParsePgn(game, conditionBeforeSave);
                        // parser.parseContent().then(() => {
                        //     console.log('Parsed game', game, line);
                        //     game = `${line}\n`;
                        //     stream.resume();
                        // });

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