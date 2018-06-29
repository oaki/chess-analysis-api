import * as Joi from 'joi';
import {WorkerController} from "./workerController";

const workerController = new WorkerController();

export function workerRoute() {
    return [
        {
            method: 'GET',
            path: '/user/workers',
            config: {

                tags: ['api', 'user'], // section in documentation
                auth: 'jwt',
                validate: {
                    query: {
                        offset: Joi.number().integer().required(),
                        limit: Joi.number().integer().max(100).required(),
                    }
                }
            },
            handler: async (request: any) => {
                const offset: number = request.query.offset;
                const limit: number = request.query.limit;
                console.log('request.auth.credentials', request.auth.credentials);
                return await workerController.getAll({
                    userId: request.auth.credentials.user_id,
                    offset,
                    limit
                });
            }
        },

        {
            method: 'GET',
            path: '/user/workers/ready',
            config: {

                tags: ['api', 'user'], // section in documentation
                auth: 'jwt',
                validate: {
                    query: {
                        uuids: Joi.array().items(Joi.string().uuid().required()).single(),
                    }
                }
            },
            handler: async (request: any) => {
                const uuids:string[] = request.query.uuids;
                return await workerController.checkStatus({
                    userId: request.auth.credentials.user_id,
                    uuids,
                });
            }
        },

        {
            method: 'POST',
            path: '/user/workers',
            config: {

                tags: ['api', 'user'], // section in documentation
                auth: 'jwt',
                validate: {
                    payload: {
                        uuid: Joi.string().uuid().required(),
                        name: Joi.string(),
                    }
                }
            },
            handler: async (request: any) => {

                const workerUuid: string = request.payload.uuid;
                const name: string = request.payload.name;

                console.log('request.auth.credentials', request.auth.credentials);

                return await workerController.add({
                    userId: request.auth.credentials.user_id,
                    workerUuid,
                    name
                });
            }
        },

        {
            method: 'DELETE',
            path: '/user/workers/{id}',
            config: {

                tags: ['api', 'user'], // section in documentation
                auth: 'jwt',
                validate: {
                    params: {
                        id: Joi.number().integer().required(),
                    }
                }
            },
            handler: async (request: any) => {

                const id: number = Number(request.params.id)

                console.log('request.auth.credentials', request.auth.credentials);

                return await workerController.delete({
                    userId: request.auth.credentials.user_id,
                    id
                });
            }
        },
    ];
}