import * as Joi from "joi";
import {ImportsController} from "../controllers/importsController";
import * as Boom from "boom";

const importController = new ImportsController();

export function importsRoute() {
    return [
        {
            method: 'GET',
            path: '/imports/{name}',
            config: {
                description: 'Filename',
                tags: ['api'], // section in documentation,
                validate: {
                    params: {
                        name: Joi.string().max(30).required().description('File name for import')
                    }
                },
            },

            handler: async (request: any, h: any) => {
                importController.import(request.params['name']);
                try {

                } catch (e) {
                    Boom.badData('Something went wrong');
                }


                return {
                    status: 'ok'
                };

            }
        },


    ];
}