import * as Joi from 'joi';
import openingsService from "../services/openingsService";
import * as Boom from "boom";

export function openingBookRoute() {
    return [
        {
            method: 'GET',
            path: '/opening-book',
            config: {
                description: 'Get variation from opening book',
                tags: ['api'], // section in documentation
                validate: {
                    query: {
                        fen: Joi.string().required().min(9).description('Forsyth–Edwards Notation (FEN) is a standard notation for describing a particular board position of a chess game. ')
                    }
                }
            },
            handler: async (request: any, h: any) => {
                const fen: string = request.query['fen'];
                const result = await openingsService.find(fen);
                console.log('result',result);
                if (!result) {
                    console.log('boom');
                    return Boom.notFound('Fen in not found.');
                }

                return result;
            }
        }

    ];
}