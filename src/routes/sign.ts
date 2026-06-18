export function signRoute() {
    return [
        {
            method: 'POST',
            path: '/sign/google',
            config: {
                tags: ['api'], // section in documentation
                auth: {
                    strategy: 'google',
                    mode: 'try'
                },
            },
            handler: (request, h) => {
                if (!request.auth.isAuthenticated) {
                    return 'Authentication failed due to: ' + request.auth.error.message;
                }

                return '<pre>' + JSON.stringify(request.auth.credentials, null, 4) + '</pre>';
            }
        }
    ];
}
