import {Connection} from "typeorm";
import {BaseResponse} from "../../libs/baseResponse";
import {Game} from "./entity/game";
import {Game as PostgreGame} from "../postgreGameDatabase/entity/game";
import * as Boom from "boom";
import {GameDatabaseModel} from "./gameDatabaseModel";
import {pgnFileReader} from "../../libs/pgnFileReader";
import {decodeFenHash} from "../../libs/fenHash";
import {gameDbConnection} from "../../libs/connectGameDatabase";
import {postgreGameDbConnection} from "../../libs/connectPostgreGameDatabase";
import {getFenHashWithoutPrefix, getMoveInstance, getMoveModel} from "./moveModel";
import {MOVE_PREFFIX} from "./entity/indexEntities";

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
        this.db = await gameDbConnection;
        console.log("init finigsgs");
    }

    private findFenInPgn(pgn, fenHash) {
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
                    if (decodeFenHash(chess2.fen()) === fenHash) {
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

        const fenHash = decodeFenHash(props.fen);

        const model = getMoveModel(fenHash);

        const query = this.db
            .getRepository(model)
            .createQueryBuilder("move")
            .innerJoinAndSelect("move.games", "game")
            .where({fenHash: getFenHashWithoutPrefix(fenHash)});
        // ORDER BY "game"."result"='1-0' DESC,"game"."result"='1/2-1/2' DESC LIMIT 50

        if (props.side === "w") {
            query.addOrderBy(`CASE 
WHEN "game.result" ='1-0' THEN (4000 - ("game.whiteElo" + "game.blackElo")/2)
ELSE
  CASE 
  WHEN "game.result" ='1/2-1/2' THEN (4000 - ("game.whiteElo" + "game.blackElo")/2 - 200)
  ELSE (4000 - ("game.whiteElo" + "game.blackElo")/2 - 400)
END
END`, "ASC");

        } else {
            query.addOrderBy(`CASE 
WHEN "game.result" ='0-1' THEN (4000 - ("game.whiteElo" + "game.blackElo")/2)
ELSE
  CASE 
  WHEN "game.result" ='1/2-1/2' THEN (4000 - ("game.whiteElo" + "game.blackElo")/2 - 200)
  ELSE (4000 - ("game.whiteElo" + "game.blackElo")/2 - 400)
END
END`, "ASC");
        }

        const moves = await query
            .limit(5)
            .getMany();

        if (moves.length === 0) {
            throw Boom.notFound();
        }

        return moves.map((move: any) => {
            const prefix = move.constructor.name.substr(MOVE_PREFFIX.length);
            const fenHash = `${prefix}${move.fenHash}`;
            const game = move.games;
            const pgn = game.pgn;
            return {...game, fewNextMove: this.findFenInPgn(pgn, fenHash)}
        });

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

            // check duplicity for pgn, if pgn is already exist
            const isExist = await this.db.getRepository(Game).findOne({
                where: {
                    pgnHash: jsMd5(game.pgn)
                }
            });

            if (!isExist) {

                const gameResult = await this.db.manager.save(gameEntity);

                for (let i = 0; i < game.positions.length; i++) {
                    const fenHash = game.positions[i].fenHash;
                    const model = getMoveInstance(fenHash);
                    model.gamesId = gameResult.id;
                    await this.db.manager.save(model);
                }

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

    async insert(games, moves) {
        await this.db.createQueryBuilder()
            .insert()
            .into(Game)
            .values(games)
            .execute();

        for (let i = 0; i < moves.length; i++) {
            const move = moves[i];
            await this.db.manager.save(move);
        }

        console.log("--------------------");
        console.log("-----INSERT NEW GAMES--------");

    }


    async copyFromPostgre() {

        console.log("Start copying from Postgre");

        let offset = 10;

        let length = null;
        while (length === null || length > 0) {
            const list = await this.getGames(offset);
            length = list.length;
            await this.insert(list.games, list.moves);
        }

        return BaseResponse.getSuccess();

    }

    async getGames(offset: number, limit: number = 100) {
        const postgreDb = await postgreGameDbConnection;

        const list = await postgreDb
            .getRepository(PostgreGame)
            .createQueryBuilder("game")
            .limit(limit)
            .offset(offset)
            .getMany();

        const games = [];
        const moves = [];

        for (let i = 0; i < list.length; i++) {
            const item = list[i];

            const game = new Game();

            game.id = item.id;
            game.white = item.white;
            game.black = item.black;
            game.whiteElo = item.whiteElo;
            game.blackElo = item.blackElo;
            game.pgn = item.pgn;
            game.pgnHash = item.pgnHash;
            game.result = item.result;

            const oldMoves = await this.getMoves(item.id);

            for (let j = 0; j < oldMoves.length; j++) {
                const oldMove = oldMoves[j];
                const model = getMoveInstance(oldMove.fenHash);
                const move = new model;
                move.fenHash = oldMove.fenHash;
                move.gamesId = item.id;
                moves.push(move);
            }

            games.push(game);
        }

        console.log("--------------------");
        console.log("-----GET GAMES--------");

        return {
            games,
            moves,
            length: games.length
        };
    }

    async getMoves(gameId: number) {
        const postgreDb = await postgreGameDbConnection;
        const res = await postgreDb
            .getRepository(PostgreGame)
            .createQueryBuilder("game")
            .select("game.id")
            .leftJoinAndSelect("game.moves", "move")
            .where({
                id: gameId
            })
            .getOne();

        return res.moves;
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