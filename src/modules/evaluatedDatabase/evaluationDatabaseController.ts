import {ParsePgn} from "../../models/ParsePgn";
import {getBasePath} from "../../config";
import * as fs from "fs";
import {evaluationConnection} from "../../libs/connectEvaluationDatabase";
import {ImportedGames} from "./entity/importedGames";
import {logger} from "../../libs/logger";

const es = require("event-stream");


export class EvaluationDatabaseController {
    private parser;

    constructor() {
        this.parser = new ParsePgn();
    }

    public loadFile(name: string, cb) {
        let game: string = "";
        let count = 0;
        const file = this.getFileName(name);

        const stream = fs.createReadStream(file)
            .pipe(es.split())
            .pipe(es.mapSync(function (line) {
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
                    logger.error({err, file}, "error reading evaluation file");
                    })
                .on("end", function () {
                        cb(game);
                        logger.debug({file}, "finished reading evaluation file");
                    })
            );
    }

    private getFileName(name: string) {
        return `${getBasePath()}/games/evaluation/${name}`;
    }

    public async importToMysql(game: string) {
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

        const db = await evaluationConnection();
        await db.createQueryBuilder()
            .insert()
            .into(ImportedGames)
            .values(values)
            .execute();
    }

    public import(name: string) {
        let game: string = "";
        const file = this.getFileName(name);

        const stream = fs.createReadStream(file)
            .pipe(es.split())
            .pipe(es.mapSync(function (line) {
                    stream.pause();

                if (line.indexOf("[Event") !== -1) {
                    } else {
                        game += `${line}\n`;
                        stream.resume();
                    }
                })
                .on("error", function (err) {
                    logger.error({err, file}, "error reading evaluation file");
                    })
                .on("end", function () {
                    logger.debug({file}, "finished reading evaluation file");
                    })
            );
    }

}