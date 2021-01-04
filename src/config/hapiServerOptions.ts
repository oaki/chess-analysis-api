export const hapiServerOptions = {
    debug: {
        request: "*",
        log: "*",
    },
    router: {
        stripTrailingSlash: true,
    },
    routes: {
        cors: true,
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