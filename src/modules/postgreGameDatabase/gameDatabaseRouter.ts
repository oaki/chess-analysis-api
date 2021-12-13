import * as Joi from "@hapi/joi";
import {getBasePath} from "../../config";
import {
    add,
    checkFen,
    deleteGame,
    get,
    optimize,
    optimizePosition,
    runDirImport,
    runImport
} from "./gameDatabaseController";
import {decodeFenHash} from "../../libs/fenHash";
import {BaseResponse} from "../../libs/baseResponse";


export function gameDatabaseRouter() {
    return [
        {
            method: "GET",
            path: "/games-database",
            config: {
                description: "Get games from game database",
                tags: ["api"], // section in documentation
                validate: {
                    query: {
                        fen: Joi.string().required().min(9).description("Forsyth–Edwards Notation (FEN) is a standard notation for describing a particular board position of a chess game. "),
                        offset: Joi.number().optional().max(100),
                        limit: Joi.number().optional().max(100),
                    },

                },
            },

            handler: async (request: any, h: any) => {
                const fen: string = request.query["fen"];
                const offset = request.query.offset;
                const limit = request.query.limit;

                const side = fen.split(" ").splice(1, 1).join("");

                const results = await get({
                    fen,
                    side: side === "w" ? "w" : "b",
                    offset,
                    limit
                });

                return h.response(results).ttl(60 * 1000 * 60 * 24 * 14);
            }
        },

        {
            method: "GET",
            path: "/games-database/optimize",
            config: {
                description: "Get moves connections to game which can be deleted",
                tags: ["api"], // section in documentation
            },

            handler: async (request: any, h: any) => {
                return await optimize();
            }
        },
        {
            method: "GET",
            path: "/games-database/optimize-position",
            config: {
                description: "Remove unnecessary game connections",
                tags: ["api"], // section in documentation
                validate: {
                    query: {
                        fen: Joi.string().required().min(9).description("Forsyth–Edwards Notation (FEN) is a standard notation for describing a particular board position of a chess game. "),
                    },
                },
            },

            handler: async (request: any, h: any) => {
                return await optimizePosition({fen: request.query["fen"]});
            }
        },
        {
            method: "GET",
            path: "/games-database/convert-fen-to-hash",
            config: {
                description: "convert-fen-to-hash",
                tags: ["api"], // section in documentation
                validate: {
                    query: {
                        fen: Joi.string().required().min(9).description("Forsyth–Edwards Notation (FEN) is a standard notation for describing a particular board position of a chess game. "),
                    },
                },
            },

            handler: async (request: any, h: any) => {
                const fen: string = request.query["fen"];
                return decodeFenHash(fen);
            }
        }, {
            method: "DELETE",
            path: "/games-database/{id}",
            config: {
                description: "convert-fen-to-hash",
                tags: ["api"], // section in documentation
                validate: {
                    params: {
                        id: Joi.number().integer().required().description("Game id")
                    }
                },
            },

            handler: async (request: any, h: any) => {
                await deleteGame({gameId: request.params.id});
                return BaseResponse.getSuccess();
            }
        },
        {
            method: "POST",
            path: "/games-database",
            config: {
                description: "Add new  game to game database",
                tags: ["api"], // section in documentation
            },
            handler: async (request: any) => {

                return await add({
                    pgn: request.payload.pgn
                });
            }
        },

        {
            method: "POST",
            path: "/games-database/import",
            config: {
                description: "Add new game to game database from file",
                tags: ["api"], // section in documentation
            },
            handler: async (request: any) => {

                return await runImport({
                    filename: request.payload.filename
                });
            }
        },

        {
            method: "POST",
            path: "/games-database/import/dir",
            config: {
                description: "Add new game to game database from dir",
                tags: ["api"], // section in documentation
            },
            handler: async () => {

                return await runDirImport({
                    dirName: `${getBasePath()}/games/game_database/`
                });
            }
        },

        {
            method: "POST",
            path: "/games-database/check-fen",
            config: {
                description: "Check if FEN is correct.",
                tags: ["api"], // section in documentation
            },
            handler: async (request: any) => {

                return await checkFen({
                    fen: request.payload.fen
                });
            }
        }

    ];
}