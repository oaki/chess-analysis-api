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
            origin: ['*'], // an array of origins or 'ignore'
            headers: ['Authorization'], // an array of strings - 'Access-Control-Allow-Headers'
            exposedHeaders: ['Accept'], // an array of exposed headers - 'Access-Control-Expose-Headers',
            additionalExposedHeaders: ['Accept'], // an array of additional exposed headers
            maxAge: 60,
            credentials: true // boolean - 'Access-Control-Allow-Credentials'
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