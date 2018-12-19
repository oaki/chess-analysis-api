import * as Joi from "joi";
import {GameDatabaseController} from "./gameDatabaseController";

const gameDatabaseController = new GameDatabaseController();

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
                    },

                }
            },
            handler: async (request: any) => {
                const fen: string = request.query["fen"];
                const side = fen.split(":").splice(8, 1).join(" ");
                return await gameDatabaseController.get({fen, side: side === "w" ? "w" : "b"});
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

                return await gameDatabaseController.add({
                    pgn: request.payload.pgn
                });
            }
        },

        {
            method: "POST",
            path: "/games-database/import",
            config: {
                description: "Add new  game to game database",
                tags: ["api"], // section in documentation
            },
            handler: async (request: any) => {

                return await gameDatabaseController.runImport({
                    filename: request.payload.filename
                });
            }
        }

    ];
}