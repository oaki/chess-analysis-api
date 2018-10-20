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
                return userController.getProfile({
                    userId: request.auth.credentials.user_id,
                })
            }
        }

    ];
}