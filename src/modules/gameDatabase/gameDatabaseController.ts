import {Connection} from "typeorm";
import {BaseResponse} from "../../libs/baseResponse";
import {Game} from "./entity/game";
import * as Boom from "boom";
import {GameDatabaseModel} from "./gameDatabaseModel";
import {Move} from "./entity/move";
import {PositionService} from "../../services/positionService";
import {connectGameDatabase} from "../../libs/connectGameDatabase";
import {pgnFileReader} from "../../libs/pgnFileReader";

export class GameDatabaseController {
    private db: Connection;

    constructor() {
        //create connection to postgre
        connectGameDatabase().then((connection) => {
            this.db = connection;
        });
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
        const result = await this.db
            .getRepository(Move)
            .createQueryBuilder("move")
            .innerJoinAndSelect("move.games", "game")
            .where("move.fen = :fen",{fen: normalizedFen})

            .addOrderBy(orderElo, "DESC")
            .limit(2)
            .getMany();
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

        } catch (e) {
            console.error(e);
            throw Boom.badRequest("Pgn is not valid");
        }

        return BaseResponse.getSuccess();

    }

    async runImport(props: runImportProps) {

        pgnFileReader(props.filename, async (pgn) => {

            await this.add({
                pgn
            })
        })

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