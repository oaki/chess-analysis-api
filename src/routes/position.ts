import Joi from "joi";
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
                    query: Joi.object({
                        fen: Joi.any().required().description('Forsyth–Edwards Notation (FEN) is a standard notation for describing a particular board position of a chess game. ')
                    })
                }
            },
            handler: async (request: any, h: any) => {
                const fen:string = request.query['fen'];

                const evaluation = await positionService.findAllMoves(fen);

                if (evaluation === null) {
                    return 'Position is not in DB. ';
                } else {
                    return evaluation;
                }
            }
        }

    ];
}
