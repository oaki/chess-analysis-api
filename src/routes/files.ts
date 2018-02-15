export function filesRoute(server) {
    return [
        {
            method: 'GET',
            path: '/files',
            config: {
                description: 'Serve files from public',
                tags: ['api'], // section in documentation
            },
            handler: async (request: any, h: any) => {
                return 'oks';

            }
        },


    ];
}