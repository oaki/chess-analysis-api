import * as Joi from "joi";
import {OpeningBookController} from "./openingBookController";

const openingBookController = new OpeningBookController();

export function openingBookRoute() {
    return [
        {
            method: "GET",
            path: "/opening-book",
            config: {
                description: "Get variation from opening book",
                tags: ["api"], // section in documentation
                validate: {
                    query: {
                        fen: Joi.string().required().min(9).description("Forsyth–Edwards Notation (FEN) is a standard notation for describing a particular board position of a chess game. ")
                    }
                }
            },
            handler: async (request: any, h: any) => {
                const fen: string = request.query["fen"];
                const results = await openingBookController.get({fen});
                return h.response(results).ttl(31536000000);
            }
        }

    ];
}