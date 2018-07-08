import {models} from "../../../../models/database";
import * as Boom from "boom";

export class HistoryController {

    async getAll(props: IGetAllProps) {
        const games = await models.Game.findAll({
            where: {
                user_id: props.userId
            },
            limit: props.limit,
            offset: props.offset,
            order: [["updated_at", props.order]],
            raw: true
        });

        return games.map((game) => {
            console.log("game", game);
            return {...game, moves: JSON.parse(game.moves)}
        });

    }

    async get(props: IGetProps) {
        const game = await models.Game.find({
            where: {
                user_id: props.userId,
                id: props.id
            },
            raw: true
        });

        game.moves = JSON.parse(game.moves);
        return game;

    }

    async getLastGame(props: IGetLastGameProps) {
        let game = await models.Game.findOne({
            where: {
                user_id: props.userId
            },
            order: [["updated_at", "DESC"]]
        });

        if (!game) {
            game = await models.Game.create({
                user_id: props.userId,
                moves: []
            });
        }else{
            game.moves = JSON.parse(game.moves);
        }

        return game;

    }

    async addNewGame(props: IAddNewGameProps) {
        const game = await models.Game.create({
            user_id: props.userId,
            moves: JSON.stringify([])
        });

        return game;

    }

    async updateGame(props: IUpdateGameProps) {

        let game = await models.Game.findOne({
            where: {
                id: props.gameId,
                user_id: props.userId
            }
        });

        if (!game) {
            throw Boom.notFound();
        }

        await game.update({
            moves: JSON.stringify(props.moves)
        });

        return game;

    }
}

interface IGetProps {
    userId: number;
    id: number;
}

interface IGetAllProps {
    offset: number;
    limit: number;
    userId: number;
    order: string;
}

interface IGetLastGameProps {
    userId: number;
}

interface IAddNewGameProps {
    userId: number;
}

interface IUpdateGameProps {
    userId: number;
    moves: any;
    gameId: number;
}