import * as Joi from 'joi';
import positionService from "../services/positionService";

export function positionRoute() {
    return [
        {
            method: 'GET',
            path: '/position/{fen}',
            config: {
                description: 'Get evaluation of the position',
                tags: ['api'], // section in documentation
                validate: {
                    query: {
                        fen: Joi.required().description('Forsyth–Edwards Notation (FEN) is a standard notation for describing a particular board position of a chess game. ')
                    }
                }
            },
            handler: async (request: any, h: any) => {
                console.log(request.query['fen']);
                // const promise = await Promise.resolve();

                const evaluation = await positionService.findAllMoves(request.query['fen']);

                console.log('evaluation', evaluation);
                if (evaluation === null) {
                    // sender.send(JSON.stringify(position));
                    return 'Not yet';
                } else {
                    const bestVariant = positionService.getBestVariant(evaluation);
                    console.log('I have it!!!!', bestVariant);

                    return JSON.parse(bestVariant);
                }

                // return positionService.findAllMoves(request.params['fen'])
            }
        }

    ];
}