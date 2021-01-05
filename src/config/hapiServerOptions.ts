export const hapiServerOptions = {
    debug: {
        request: "*",
        log: "*",
    },
    router: {
        stripTrailingSlash: true,
    },
    routes: {
        cors: {
            origin: ['http://localhost:3000','https://www.chess-analysis.com'],
            additionalHeaders: ['cache-control', 'x-requested-with', 'Accept', 'Authorization']
        },
        validate: {
            failAction: async (request, h, err) => {
                throw err;
            },
        },
        files: {
            relativeTo: __dirname + "/public"
        }
    },
    port: process.env.SERVER_PORT,

};