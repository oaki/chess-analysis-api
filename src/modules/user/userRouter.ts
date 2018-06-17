import {UserController} from "./userController";

const userController = new UserController();

export function userRoute() {
    return [
        {
            method: 'GET',
            path: '/user/profile',
            config: {
                auth: 'jwt',
                tags: ['api'], // section in documentation
            },
            handler: (request) => {
                console.log('request', request.auth.credentials);
                return userController.getProfile({
                    user_id: request.auth.credentials.user_id,
                })
            }


        }

    ];
}