import {In} from "typeorm";
import * as Boom from "boom";
import {Move} from "./entity/move";
import {decodeFenHash} from "../../libs/fenHash";
import {GameDatabaseModel} from "./gameDatabaseModel";
import {calculationGameCoefficient, convertResult} from "../../libs/utils";
import {Game} from "./entity/game";
import {BaseResponse} from "../../libs/baseResponse";
import {pgnFileReader} from "../../libs/pgnFileReader";
import {GameMovesMove} from "./entity/gameMovesMove";
import {ErrorPgnGame} from "./entity/errorPgnGame";
import {gameDbConnection} from "../../libs/connectGameDatabase";

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

function findFenInPgn(pgn: string, fenHash) {
    const ch1 = new Chess();
    const regex = /([0-9]{1,3})(\. )([a-zA-Z\-0-8\+\=]{1,6})( )([a-zA-Z\-0-8\+\=]{1,6})/gm;

    let match;
    let moveCounter = 0;

    let lastMove;
    let fenReferenceObj;

    const allMoves = [];
    while (match = regex.exec(pgn)) {

        if (fenReferenceObj) {
            allMoves.push(match[3]);
            allMoves.push(match[5]);

            moveCounter++;

            if (moveCounter > 5) {
                break;
            }
        }

        if (!fenReferenceObj) {
            lastMove = ch1.move(match[3], {sloppy: true});
            const fen = ch1.fen();
            if (decodeFenHash(fen) === fenHash) {
                fenReferenceObj = fen;
                allMoves.push(match[5]);
            }
        }

        if (!fenReferenceObj) {
            lastMove = ch1.move(match[5], {sloppy: true});

            const fen2 = ch1.fen();
            if (decodeFenHash(fen2) === fenHash) {
                fenReferenceObj = fen2;
            }
        }
    }
    return allMoves;
}

export async function get(props: GetProps) {
    const p1 = performance.now();

    const fenHash = decodeFenHash(props.fen);
    console.log({fen: props.fen, fenHash});
    const db = await gameDbConnection();
    const move = await db.getRepository(Move)
        .createQueryBuilder("move")
        .select("id")
        .where({fenHash}).getRawOne<Move>();
    console.log("move");
    if (!move) {
        throw Boom.notFound();
    }

    const gameIds = await db.manager.query(`
        SELECT 
            game_moves_move."gameId" 
        FROM 
            game_moves_move 
        WHERE 
            game_moves_move."moveId" = ${move.id} 
        ORDER BY ${props.side === "w" ? "game_moves_move.cw" : "game_moves_move.cb"} 
        OFFSET ${props.offset ? props.offset : "0"}
        LIMIT ${props.limit ? props.limit : "5"}
        `);

    const ids = gameIds.map((obj) => obj.gameId).join(", ");
    const games = await db.manager.query(`
        SELECT game.* FROM game WHERE game.id IN (${ids})
        ORDER BY POSITION(id::text IN '${ids}')
        `);

    if (games.length === 0) {
        throw Boom.notFound();
    }

    const p2 = performance.now();

    const result = {
        games: games.map((game) => {
            return {
                id: game.id,
                white: game.white,
                black: game.black,
                whiteElo: game.whiteElo,
                blackElo: game.blackElo,
                result: game.result,
                pgnHash: game.pgnHash,
                fewNextMove: findFenInPgn(game.pgn, fenHash)
            }
        })
    };

    const p3 = performance.now();

    console.log("Total time: ", p3 - p1);
    console.log("Searching time time: ", p2 - p1);
    console.log("Mapping time time: ", p3 - p2);

    // await optimizePosition({fen:props.fen});
    return result;
}

export async function checkFen(props: CheckFenProps) {
    try {
        return decodeFenHash(props.fen);
    } catch (e) {
        console.log(e);
        throw Boom.badData();
    }

}

export async function deleteGame({gameId}) {
    const db = await gameDbConnection();
    const game = await db.getRepository(Game)
        .createQueryBuilder()
        .where({
            id: gameId
        }).getOne();

    if (!game) {
        throw Boom.notFound("Game id is not exist");
    }

    const gameMovesMoves = await db.getRepository(GameMovesMove)
        .createQueryBuilder()
        .where({
            gameId: gameId
        }).getMany();

    const moves = gameMovesMoves.map((gameMovesMove) => gameMovesMove.moveId);

    const movesToDelete = [];
    for (let i = 0; i < moves.length; i++) {
        const moveId = moves[i];

        const movesCount = await db.getRepository(GameMovesMove)
            .createQueryBuilder()
            .where({
                moveId: moveId
            }).limit(2).getRawMany();

        if (movesCount.length === 1) {
            movesToDelete.push(moveId);
        }
    }

    await db.getRepository(GameMovesMove)
        .createQueryBuilder()
        .delete()
        .where({
            gameId: gameId
        }).execute();

    console.log("DELETE GameMovesMove DONE!");


    await db.getRepository(Move)
        .createQueryBuilder()
        .delete()
        .where({
            id: In(movesToDelete)
        }).execute();
    console.log("DELETE Move DONE!");

    await db.getRepository(Game)
        .createQueryBuilder()
        .delete()
        .where({
            id: gameId
        }).execute();

    console.log("DELETE Game DONE!");
}


export async function optimizePosition(props: { fen: string }) {
    console.log("----------------------------");
    console.log("-----optimizePosition------");
    console.log("----------------------------");
    const p1 = performance.now();
    const NUM_GAMES_PER_MOVE = 2000;
    const sideFromFen = props.fen.split(" ").splice(1, 1).join("");

    const side = sideFromFen === "w" ? "w" : "b";

    const fenHash = decodeFenHash(props.fen);
    console.log({fen: props.fen, fenHash});
    const db = await gameDbConnection();
    const move = await db.getRepository(Move)
        .createQueryBuilder("move")
        .select(["id", `"numOfGames"`])
        .where({fenHash}).getRawOne<Move>();

    if (!move) {
        throw Boom.notFound();
    }

    const gamesId = await db.manager.query(`
        SELECT 
            "gameId"
        FROM 
            game_moves_move 
        WHERE 
            game_moves_move."moveId" = ${move.id}
        ORDER BY ${side === "w" ? "game_moves_move.cw" : "game_moves_move.cb"}
        `);

    if (!move.numOfGames) {
        await db.manager.query(`UPDATE move SET "numOfGames" = ${gamesId.length} WHERE id = ${move.id}`);
    }

    console.log("count", gamesId.length);

    if (gamesId.length > NUM_GAMES_PER_MOVE) {
        const gameIdsForDelete = gamesId.map(obj => obj.gameId).slice(NUM_GAMES_PER_MOVE).join(", ");
        await db.manager.query(`DELETE FROM
        game_moves_move
        WHERE
        "moveId" = ${move.id}
        AND "gameId" IN (${gameIdsForDelete})`);
    }

    const p2 = performance.now();
    console.log("Total time: ", p2 - p1);

    return BaseResponse.getSuccess();
    // const gameIds = await db.manager.query(`
    //     SELECT
    //         game_moves_move."gameId"
    //     FROM
    //         game_moves_move
    //     WHERE
    //         game_moves_move."moveId" = ${move.id}
    //     ORDER BY ${side === "w" ? "game_moves_move.cw" : "game_moves_move.cb"}
    //     OFFSET ${props.offset ? props.offset : "0"}
    //     LIMIT ${props.limit ? props.limit : "5"}
    //     `);

}

export async function optimize() {
    const db = await gameDbConnection();

    const p1 = performance.now();

    const allGames = await db.getRepository(Game)
        .createQueryBuilder()
        .select("id")
        .where({
            whiteElo: 0,
            blackElo: 0
        })
        .limit(100)
        .getRawMany();

    const p2 = performance.now();
    console.log("allGamesId", allGames);
    for (let i = 0; i < allGames.length; i++) {
        const gameId = allGames[i].id;
        const p5 = performance.now();
        await deleteGame({gameId});
        const p6 = performance.now();
        console.log("DELETE on line: ", p6 - p5);
    }
    const p3 = performance.now();
    console.log("Total time: ", p3 - p1);
    console.log("get all games: ", p2 - p1);
    console.log("Deleting time: ", p3 - p2);

    ``
//     const gameIdss = await db.manager.query(`
//         SELECT game.*, game_moves_move.cw
// FROM game_moves_move JOIN game ON game.id = game_moves_move."gameId"
// WHERE game_moves_move."moveId" = 28894
// ORDER BY game_moves_move.cw DESC
// LIMIT 5
//         `);

//     const gameIds = await db.manager.query(`
//         SELECT "moveId", COUNT("moveId")
// FROM game_moves_move
// GROUP BY "moveId"
// ORDER BY COUNT("moveId")
// LIMIT 5
//         `);

    return BaseResponse.getSuccess();

}

export async function add(props: AddProps) {

    const db = await gameDbConnection();
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
        gameEntity.originalPgn = props.pgn;
        gameEntity.pgnHash = jsMd5(game.pgn);

        const coefW = calculationGameCoefficient("w", convertResult(gameEntity.result), gameEntity.whiteElo, gameEntity.blackElo);
        const coefB = calculationGameCoefficient("b", convertResult(gameEntity.result), gameEntity.whiteElo, gameEntity.blackElo);

        const isExist = await db.getRepository(Game).findOne({
            where: {
                pgnHash: jsMd5(game.pgn)
            }
        });

        if (!isExist) {

            const newGame = await db.manager.save(gameEntity);

            const fenHashBulk = game.positions.map((position) => {
                return {
                    fenHash: position.fenHash,
                    numOfGames: 0
                }
            });

            const moves = await insertAndReturnMoves(fenHashBulk);
            const gameMovesMoveBulk: GameMovesMove[] = moves.map(move => {

                const obj = new GameMovesMove();
                obj.cb = Number(coefB);
                obj.cw = Number(coefW);
                obj.gameId = newGame.id;
                obj.moveId = move.id;

                return obj;
            });

            await db.createQueryBuilder()
                .insert()
                .into(GameMovesMove)
                .values(gameMovesMoveBulk)
                .execute();
            console.log("Game was add.");
        } else {
            console.log(isExist);
            console.log("Game is already exist.");
        }


    } catch (e) {
        console.error(e);
        const errorPgnGameEntity = new ErrorPgnGame();
        errorPgnGameEntity.pgn = props.pgn;
        errorPgnGameEntity.errorMsg = JSON.stringify(e);
        await db.manager.save(errorPgnGameEntity);
        throw Boom.badRequest(`Pgn is not valid: ${props.pgn}`);
    }

    return BaseResponse.getSuccess();

}

async function insertAndReturnMoves(fenHashBulk: Move[]): Promise<Move[]> {

    const db = await gameDbConnection();

    await db.createQueryBuilder()
        .insert()
        .into(Move)
        .values(fenHashBulk)
        .onConflict(`(
    "fenHash"
)
    DO
    NOTHING
`)
        .execute();

    const moves = await db.getRepository(Move)
        .createQueryBuilder()
        .where({
            fenHash: In(fenHashBulk.map(m => m.fenHash))
        }).getMany();

    await db.createQueryBuilder()
        .update(Move)
        .set({
            numOfGames: () => "numOfGames + 1"
        })
        .where({
            fenHash: In(moves.map(m => m.fenHash))
        });

    return moves;
}

export async function runImport(props: RunImportProps) {

    pgnFileReader(props.filename, async (pgn) => {

        try {
            await add({
                pgn
            })
        } catch (e) {
            console.log("PGN is not valid", e);
        }

    })

    return BaseResponse.getSuccess();

}

export async function runDirImport(props: RunDirImportProps) {

    console.log("Start import from dir", props.dirName);
    fs.readdir(props.dirName, async (err, items) => {

        for (let i = 0; i < items.length; i++) {
            const filename = `${props.dirName}${items[i]}`;
            console.log({filename});
            await runImport({
                filename
            });
        }

        console.log("End import from dir");
    });


    return BaseResponse.getSuccess();

}

interface GetProps {
    fen: string;
    offset?: number;
    limit?: number;
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