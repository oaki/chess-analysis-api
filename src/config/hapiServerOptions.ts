import {getConfig} from './index';
const config = getConfig();

export const hapiServerOptions = {
    debug: {
        request: '*',
        log: '*',
    },
    router: {
        stripTrailingSlash: true,
    },
    routes: {
        validate: {
            failAction: async (request, h, err) => {
                throw err;
            },
        },
        files: {
            relativeTo: __dirname + '/public'
        }
    },
    port: config.server.port,
};