import * as Joi from 'joi';
import {HistoryController} from "./historyController";

const historyController = new HistoryController();

export function historyRoute() {
    return [
        {
            method: 'GET',
            path: '/user/history',
            config: {
                description: 'Get positions',
                tags: ['api', 'history'], // section in documentation
                auth: 'jwt',
                validate: {
                    query: {
                        offset: Joi.number().integer().required(),
                        limit: Joi.number().integer().max(100).required(),
                    }
                }
            },
            handler: async (request: any) => {
                const offset: number = request.query.offset;
                const limit: number = request.query.limit;
                console.log('request.auth.credentials', request.auth.credentials);
                return await historyController.get({
                    userId: request.auth.credentials.user_id,
                    offset,
                    limit
                });
            }
        },

        {
            method: 'GET',
            path: '/user/history:last',
            config: {
                description: 'Get positions',
                tags: ['api', 'history'], // section in documentation
                auth: 'jwt'
            },
            handler: async (request: any) => {
                console.log('request.auth.credentials', request.auth.credentials);
                return await historyController.getLastGame({
                    userId: request.auth.credentials.user_id,
                });
            }
        },

        {
            method: 'PUT',
            path: '/user/history/{id}',
            config: {
                description: 'Update game',
                tags: ['api', 'history'], // section in documentation
                auth: 'jwt',

                validate: {
                    payload: {
                        moves: Joi.object().required().description('Moves'),
                    },
                    params: {
                        id: Joi.number().integer().required().description('Game id')
                    }
                }
            },
            handler: async (request: any) => {

                return await historyController.updateGame({
                    userId: request.auth.credentials.user_id,
                    gameId: request.params.id,
                    moves: request.payload.moves
                });
            }
        }

    ];
}