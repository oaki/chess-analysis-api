import {SyncController} from "./syncController";

const syncController = new SyncController();

export function syncRoute() {
    return [
        {
            method: 'GET',
            path: '/sync/database',
            config: {
                tags: ['api'], // section in documentation
            },
            handler: async (request) => {

                return await syncController.sync({force: request.query.force})
            }


        }

    ];
}