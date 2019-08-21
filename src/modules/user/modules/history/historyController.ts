import * as Boom from "boom";
import {initPgnParser} from "../../../../models/ParsePgn";
import {appDbConnection} from "../../../../libs/connectAppDatabase";
import {Game} from "../../entity/game";
import {User} from "../../entity/user";

const Chess = require("chess.js").Chess;

export class HistoryController {

    async getAll(props: IGetAllProps) {

        const db = await appDbConnection;
        const gameRepository = await db.getRepository(Game);
        const games = await gameRepository
            .createQueryBuilder("Game")
            .where({
                user_id: props.userId
            })
            .limit(props.limit)
            .offset(props.offset)
            .orderBy("updated_at", props.order)
            .execute();

        return games.map((game) => {
            console.log("game", game);
            return {...game, moves: JSON.parse(game.moves)}
        });

    }

    async get(props: IGetProps) {
        const db = await appDbConnection;
        const gameRepository = await db.getRepository(Game);

        const game = await gameRepository.findOne({
            where: {
                user_id: props.userId,
                id: props.id
            }
        });

        console.log({game});
        game.moves = JSON.parse(game.moves);
        return game;

    }

    async getLastGame(props: IGetLastGameProps) {

        const db = await appDbConnection;
        const gameRepository = await db.getRepository(Game);
        const userRepository = await db.getRepository(User);

        const games = await gameRepository
            .createQueryBuilder("game")
            .leftJoinAndSelect("game.user", "user")
            .where("user.id = :id", {id: props.userId})
            .orderBy("updated_at", "DESC")
            .getMany();


        console.log({games});
        if (games.length === 0) {
            const game = new Game();
            game.moves = "[]";
            const user = await userRepository.findOne(props.userId);
            console.log({userId: props.userId, user});
            game.user = user;

            await gameRepository.save(game);

            return {...game, moves: game.getMoves()};
        } else {
            return {...games[0], moves: games[0].getMoves()};
        }
    }

    static async addNewGame(props: IAddNewGameProps) {
        const db = await appDbConnection;
        console.log("props-----------", props);
        const userRepository = await db.getRepository(User);
        const user = await userRepository.findOneOrFail(props.userId);
        console.log("user---------------", user);
        const game = new Game();
        game.moves = props.moves || "[]";
        game.user = user;
        await db.getRepository(Game).save(game);
        console.log("game ---------------", game);
        return game;

    }

    async importNewGameFromPgn(props: IImportNewGameFromPgnProps) {
        //parse pgn

        const pgnParser: any = await initPgnParser();

        const pgn = props.pgn.split(/[\n\r\r\t]+/g).join(" ").trim();

        try {
            const game = pgnParser.parse(pgn);

            if (game.length > 0) {
                const headers = game[0].headers;
                const moves = game[0].moves;
                console.log({headers, moves});


                const chess = new Chess();
                const newMoves = moves.map((moveObj: any, index: number) => {


                    const isAdded = chess.move(moveObj.move, {sloppy: true});
                    console.log("isAdded", isAdded);
                    if (!isAdded) {
                        throw new Error(`Move is not valid: ${moveObj.move}`);
                    }
                    return {
                        id: index + 1,
                        f: chess.fen(),
                        m: moveObj.move,
                        s: isAdded.san,
                        vs: []
                    };
                });

                await HistoryController.addNewGame({
                    userId: props.userId,
                    moves: JSON.stringify(newMoves)
                });
            }
        } catch (e) {
            console.error(e);
            throw Boom.badRequest("Fen is not valid");
        }
    }

    async updateGame(props: IUpdateGameProps) {

        const db = await appDbConnection;
        const gameRepository = await db.getRepository(Game);
        // const userRepository = await db.getRepository(User);

        // const user = await userRepository.findOneOrFail(props.userId);


        let game = await gameRepository.findOne({
            where: {
                id: props.gameId,
                userId: props.userId
            }
        });

        if (!game) {
            throw Boom.notFound();
        }

        game.moves = JSON.stringify(props.moves);

        await gameRepository.save(game);

        return game;

    }
}

interface IGetProps {
    userId: number;
    id: number;
}

export type OrderType = "ASC" | "DESC";

interface IGetAllProps {
    offset: number;
    limit: number;
    userId: number;
    order: OrderType;
}

interface IGetLastGameProps {
    userId: number;
}

interface IAddNewGameProps {
    userId: number;
    moves?: string;
}

interface IImportNewGameFromPgnProps {
    userId: number;
    pgn: string;
}

interface IUpdateGameProps {
    userId: number;
    moves: any;
    gameId: number;
}