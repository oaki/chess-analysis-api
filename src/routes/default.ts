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
<a href="/documentation">Swagger Documentation</a><br />
host: ${server.info.host}<br />
port: ${server.info.port}<br />
uri: ${server.info.uri}<br />
address: ${server.info.address}<br />
                `;
            }
        },


    ];
}