import * as Joi from 'joi';
import positionService from "../services/positionService";

export function positionRoute() {
    return [
        {
            method: 'GET',
            path: '/position',
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
                const fen:string = request.query['fen'];
                console.log(fen);
                // const promise = await Promise.resolve();

                const evaluation = await positionService.findAllMoves(fen);

                console.log('evaluation', evaluation);
                if (evaluation === null) {
                    // sender.send(JSON.stringify(position));
                    return 'Position is not in DB. ';
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