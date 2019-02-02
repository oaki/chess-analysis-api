import {Connection} from "typeorm";
import {BaseResponse} from "../../libs/baseResponse";
import {Game} from "./entity/game";
import * as Boom from "boom";
import {GameDatabaseModel} from "./gameDatabaseModel";
import {Move} from "./entity/move";
import {PositionService} from "../../services/positionService";
import {connectGameDatabase} from "../../libs/connectGameDatabase";
import {pgnFileReader} from "../../libs/pgnFileReader";

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
        //create connection to postgre
        connectGameDatabase().then((connection) => {
            this.db = connection;
        }).catch((e) => {
            console.log("eeeeee", e);
        });
    }

    private findFenInPgn(pgn, fen) {
        const chess = new Chess();
        const chess2 = new Chess();
        chess.load_pgn(pgn);
        const moves = chess.history();
        const nextFewMoves = [];
        let counter = 0;
        let isFound = false;
        for (let i = 0; i < moves.length; i++) {
            const move2 = chess2.move(moves[i]);
            if (move2) {
                if (!isFound) {
                    const newFen = PositionService.normalizeFen(chess2.fen());

                    if (newFen === fen) {
                        isFound = true;
                    }
                } else if (counter < 10) {
                    nextFewMoves.push(move2);
                    counter++;
                }

                if (counter > 10) {
                    break;
                }
            }
        }

        return nextFewMoves.map(move => move.san);
    }

    async get(props: GetProps) {

        console.log(props);
        const normalizedFen = PositionService.normalizeFen(props.fen);
        // const moveEntity = await this.db.getRepository(Game)
        //     .createQueryBuilder("game")
        //     .innerJoin("move")
        //     .where("(move.fen = :fen)")
        //     .setParameters({fen: props.fen})
        //     .orderBy("game.whiteElo", "DESC")
        //     .getMany();

        const orderElo = props.side === "w" ? "game.whiteElo" : "game.blackElo";
        const moves: Move[] = await this.db
            .getRepository(Move)
            .createQueryBuilder("move")
            .innerJoinAndSelect("move.games", "game")
            .where("move.fen = :fen", {fen: normalizedFen})

            .addOrderBy(orderElo, "DESC")
            .limit(5)
            .getMany();

        if (moves.length === 0) {
            throw Boom.notFound();
        }

        const result: any = moves[0];
        result.games = result.games.map((game) => {
            const fen = result.fen;
            const pgn = game.pgn;

            return {...game, fewNextMove: this.findFenInPgn(pgn, fen)}
        })

        console.log("Result: ", result);

        return result;

    }

    async add(props: addProps) {

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
            gameEntity.moves = [];

            // check duplicity for pgn, if pgn is already exist
            const isExist = await this.db.getRepository(Game).findOne({
                where: {
                    pgn: game.pgn
                }
            });

            if (!isExist) {

                // const moveRepository = this.db.getRepository(Move);
                for (let i = 0; i < game.positions.length; i++) {

                    let fen = game.positions[i].fen;
                    const moveData = {
                        fen: fen,
                        data: null
                    };

                    await this.db.createQueryBuilder()
                        .insert()
                        .into(Move)
                        .values(moveData)
                        .onConflict(`("fen") DO NOTHING`)
                        .execute();

                    const moveEntity = await this.db.getRepository(Move)
                        .createQueryBuilder("move")
                        .where("(move.fen = :fen)")
                        .setParameters({fen: fen})
                        .getOne();

                    gameEntity.moves.push(moveEntity);

                }

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

    async runImport(props: runImportProps) {

        console.log("File ", props.filename);
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

    async runDirImport(props: runDirImportProps) {

        console.log("Start import from dir");
        fs.readdir(props.dirName, async (err, items) => {

            for (const item of items) {
                await this.runImport({
                    filename: `${props.dirName}${item}`
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

interface addProps {
    pgn: string;
}

interface runImportProps {
    filename: string;
}

interface runDirImportProps {
    dirName: string;
}