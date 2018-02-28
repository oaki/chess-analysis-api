export function defaultRoute(server) {
    return [
        {
            method: 'GET',
            path: '/',
            config: {
                description: 'Default route',
                tags: ['api'], // section in documentation
            },
            handler: async (request: any, h: any) => {

                return `Default route is running
host: ${server.info.host}
port: ${server.info.port}
uri: ${server.info.uri}
address: ${server.info.address}
                `;
            }
        },


    ];
}