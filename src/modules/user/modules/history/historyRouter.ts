import * as Joi from "joi";
import {HistoryController, OrderType} from "./historyController";

const historyController = new HistoryController();

export function historyRoute() {
    return [
        {
            method: "POST",
            path: "/user/history",
            config: {
                description: "add new game",
                tags: ["api", "history"], // section in documentation
                auth: "jwt",
            },
            handler: async (request: any) => {
                return await HistoryController.addNewGame({
                    userId: request.auth.credentials.user_id,
                });
            }
        },

        {
            method: "DELETE",
            path: "/user/history/{id}",
            config: {
                description: "remove game",
                tags: ["api", "history"], // section in documentation
                auth: "jwt",
                validate: {
                    params: {
                        id: Joi.number().integer().required().description("Game id")
                    }
                },
            },
            handler: async (request: any) => {
                return await HistoryController.removeGame({
                    id: Number(request.params.id),
                    userId: request.auth.credentials.user_id,
                });
            }
        },
        {
            method: "POST",
            path: "/user/history/import-pgn",
            config: {
                description: "Import new game from PGN format",
                tags: ["api", "history"], // section in documentation
                auth: "jwt",
            },
            handler: async (request: any) => {
                const payload = JSON.parse(request.payload);

                return await historyController.importNewGameFromPgn({
                    userId: request.auth.credentials.user_id,
                    pgn: payload.pgn
                });
            }
        },

        {
            method: "GET",
            path: "/user/history",
            config: {
                description: "Get positions",
                tags: ["api", "history"], // section in documentation
                auth: "jwt",
                validate: {
                    query: {
                        offset: Joi.number().integer().required(),
                        limit: Joi.number().integer().max(100).required(),
                        order: Joi.allow("ASC", "DESC").required()
                    }
                }
            },
            handler: async (request: any) => {
                const offset: number = request.query.offset;
                const limit: number = request.query.limit;
                const order: OrderType = request.query.order;
                console.log("request.auth.credentials", request.auth.credentials);
                return await historyController.getAll({
                    userId: request.auth.credentials.user_id,
                    offset,
                    limit,
                    order
                });
            }
        },

        {
            method: "GET",
            path: "/user/history:last",
            config: {
                description: "Get positions",
                tags: ["api", "history"], // section in documentation
                auth: "jwt"
            },
            handler: async (request: any) => {
                console.log("request.auth.credentials", request.auth.credentials);
                return await historyController.getLastGame({
                    userId: request.auth.credentials.user_id,
                });
            }
        },

        {
            method: "GET",
            path: "/user/history/{id}",
            config: {
                description: "Get position",
                tags: ["api", "history"], // section in documentation
                auth: "jwt",
                validate: {
                    params: {
                        id: Joi.number().integer().required().description("Game id")
                    }
                },
            },

            handler: async (request: any) => {
                console.log("request.auth.credentials", request.auth.credentials);
                return await historyController.get({
                    userId: request.auth.credentials.user_id,
                    id: request.params.id,
                });
            }
        },

        {
            method: "PUT",
            path: "/user/history/{id}",
            config: {
                description: "Update game",
                tags: ["api", "history"], // section in documentation
                auth: "jwt",

                validate: {
                    payload: {
                        moves: Joi.array().required().description("Moves"),
                    },
                    params: {
                        id: Joi.number().integer().required().description("Game id")
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