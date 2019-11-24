import {Connection, In} from "typeorm";
import {BaseResponse} from "../../libs/baseResponse";
import {Game} from "./entity/game";
import * as Boom from "boom";
import {GameDatabaseModel} from "./gameDatabaseModel";
import {Move} from "./entity/move";
import {pgnFileReader} from "../../libs/pgnFileReader";
import {decodeFenHash} from "../../libs/fenHash";
import {postgreGameDbConnection} from "../../libs/connectPostgreGameDatabase";
const {performance} = require("perf_hooks");

const jsMd5 = require("js-md5");

const Chess = require("chess.js").Chess;

const fs = require("fs");

export interface IGames {
    id: string;
    white: string;
    black: string;
    whiteElo: number;
    blackElo: number;
    pgn: string;
    result: string;
}

export interface IGameDatabase {
    id: number;
    fen: string;
    data: any;
    games: IGames[];
}

export class GameDatabaseController {
    private db: Connection;

    constructor() {
        this.initConnection();
    }

    async initConnection() {
        this.db = await postgreGameDbConnection;
    }

    private findFenInPgn(pgn: string, fenHash, fenReferenceObj) {
        const ch1 = new Chess();
        const regex = /([0-9]{1,3})(\. )([a-zA-Z\-0-8\+\=]{1,6})( )([a-zA-Z\-0-8\+\=]{1,6})/gm;

        let match;
        let moveCounter = 0;
        const ms = [];
        let lastMove;

        while (match = regex.exec(pgn)) {

            lastMove = ch1.move(match[3], {sloppy: true});

            if (fenReferenceObj.ref && moveCounter < 10) {
                ms.push(lastMove);
                moveCounter++;
            }

            if (moveCounter > 10) {
                break;
            }

            if (!fenReferenceObj.ref) {
                const fen = ch1.fen();
                if (decodeFenHash(fen) === fenHash) {
                    fenReferenceObj.ref = fen;
                }
            }

            lastMove = ch1.move(match[5], {sloppy: true});

            if (fenReferenceObj.ref && moveCounter < 10) {
                ms.push(lastMove);
                moveCounter++;
            }

            if (moveCounter > 10) {
                break;
            }

            if (!fenReferenceObj.ref) {
                const fen = ch1.fen();
                if (decodeFenHash(fen) === fenHash) {
                    fenReferenceObj.ref = fen;
                }
            }
        }
        // console.log({ms});

        // const chess = new Chess();
        // const chess2 = new Chess();
        // chess.load_pgn(pgn, {sloppy: false});
        // const moves = chess.history();
        // const nextFewMoves = [];
        // let counter = 0;
        // let isFound = false;
        // for (let i = 0; i < moves.length; i++) {
        //     const move2 = chess2.move(moves[i]);
        //     if (move2) {
        //         if (!isFound) {
        //             if (decodeFenHash(chess2.fen()) === fenHash) {
        //                 isFound = true;
        //             }
        //         } else if (counter < 10) {
        //             nextFewMoves.push(move2);
        //             counter++;
        //         }
        //
        //         if (counter > 10) {
        //             break;
        //         }
        //     }
        // }

        return ms.map(move => move.san);
    }

    async get(props: GetProps) {
        const p1 = performance.now();

        const fenHash = decodeFenHash(props.fen);

        const move = await this.db
            .getRepository(Move)
            .createQueryBuilder("move")
            .select("id")
            .where({fenHash}).getRawOne();

        const games = await this.db.manager.query(`
        SELECT game.* FROM game WHERE game.id IN 
            (
                SELECT 
                    game_moves_move."gameId" 
                FROM 
                    game_moves_move 
                WHERE 
                    game_moves_move."moveId" = ${move.id} 
                ORDER BY ${props.side === "w" ? "game_moves_move.cw" : "game_moves_move.cb"} LIMIT 5
            )
        `);


        if (games.length === 0) {
            throw Boom.notFound();
        }

        const p2 = performance.now();

        let fenReference = {};
        const result = {
            games: games.map((game) => {
                console.log({fenReference});
                return {
                    id: game.id,
                    white: game.white,
                    black: game.black,
                    whiteElo: game.whiteElo,
                    blackElo: game.blackElo,
                    result: game.result,
                    pgnHash: game.pgnHash,
                    fewNextMove: this.findFenInPgn(game.pgn, fenHash, fenReference)
                }
            })
        };

        const p3 = performance.now();

        console.log("Total time: ", p3 - p1);
        console.log("Searching time time: ", p2 - p1);
        console.log("Mapping time time: ", p3 - p2);

        return result;
    }

    async checkFen(props: CheckFenProps) {
        try {
            return decodeFenHash(props.fen);
        } catch (e) {
            console.log(e);
            throw Boom.badData();
        }

    }

    async add(props: AddProps) {

        const model = new GameDatabaseModel();

        try {

            const game = await model.parsePgn(props.pgn);
            const gameEntity = new Game();

            gameEntity.white = game.headers.white;
            gameEntity.black = game.headers.black;
            gameEntity.whiteElo = game.headers.whiteElo;
            gameEntity.blackElo = game.headers.blackElo;
            gameEntity.result = game.headers.result;
            gameEntity.pgn = game.pgn;
            gameEntity.pgnHash = jsMd5(game.pgn);
            gameEntity.moves = [];

            // check duplicity for pgn, if pgn is already exist
            const isExist = await this.db.getRepository(Game).findOne({
                where: {
                    pgnHash: jsMd5(game.pgn)
                }
            });

            if (!isExist) {

                const fenHashBulk = game.positions.map((position) => {
                    return {
                        fenHash: position.fenHash
                    }
                });

                const fenHashBulkFind = game.positions.map((position) => {
                    return position.fenHash
                });
                await this.db.createQueryBuilder()
                    .insert()
                    .into(Move)
                    .values(fenHashBulk)
                    .onConflict(`("fenHash") DO NOTHING`)
                    .execute();

                const moveEntities = await this.db.getRepository(Move)
                    .createQueryBuilder("move")
                    .where({

                        fenHash: In(fenHashBulkFind)

                    })
                    .getMany();


                gameEntity.moves = (moveEntities);


                await this.db.manager.save(gameEntity);
                console.log("Game was add.");
            } else {
                console.log(isExist);
                console.log("Game is already exist.");
            }

        } catch (e) {
            console.error(e);
            throw Boom.badRequest("Pgn is not valid");
        }

        return BaseResponse.getSuccess();

    }

    async runImport(props: RunImportProps) {

        pgnFileReader(props.filename, async (pgn) => {

            try {
                await this.add({
                    pgn
                })
            } catch (e) {
                console.log("PGN is not valid", e);
            }

        })

        return BaseResponse.getSuccess();

    }

    async runDirImport(props: RunDirImportProps) {

        console.log("Start import from dir", props.dirName);
        fs.readdir(props.dirName, async (err, items) => {

            for (let i = 0; i < items.length; i++) {
                const filename = `${props.dirName}${items[i]}`;
                console.log({filename});
                await this.runImport({
                    filename
                });
            }

            console.log("End import from dir");
        });


        return BaseResponse.getSuccess();

    }
}

interface GetProps {
    fen: string;
    side: "b" | "w";
}

interface CheckFenProps {
    fen: string;
}

interface AddProps {
    pgn: string;
}

interface RunImportProps {
    filename: string;
}

interface RunDirImportProps {
    dirName: string;
}