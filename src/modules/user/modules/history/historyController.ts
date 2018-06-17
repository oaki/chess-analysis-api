import {models} from "../../../../models/database";
import * as Boom from "boom";

export class HistoryController {

    async get(props: IGetProps) {
        const games = await models.Game.findAll({
            where: {
                user_id: props.userId
            },
            limit: props.limit,
            offset: props.offset
        });

        return games;

    }

    async getLastGame(props: IGetLastGameProps) {
        let game = await models.Game.findOne({
            where: {
                user_id: props.userId
            },
            order: [['updated_at', 'DESC']]
        });

        if (!game) {
            game = await models.Game.create({
                user_id: props.userId,
                moves: JSON.stringify([])
            });
        }

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
    offset: number;
    limit: number;
    userId: number;
}

interface IGetLastGameProps {
    userId: number;
}

interface IUpdateGameProps {
    userId: number;
    moves: any;
    gameId: number;
}