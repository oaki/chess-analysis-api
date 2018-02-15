import * as Joi from 'joi';
import openingsService from "../services/openingsService";

export function openingBookRoute() {
    return [
        {
            method: 'GET',
            path: '/opening-book/{fen}',
            config: {
                description: 'Get variation from opening book',
                tags: ['api'], // section in documentation
                validate: {
                    params: {
                        fen: Joi.required().description('Forsyth–Edwards Notation (FEN) is a standard notation for describing a particular board position of a chess game. ')
                    }
                }
            },
            handler: async (request: any, h: any) => {
                return await openingsService.find(request.params['fen']);
            }
        }

    ];
}