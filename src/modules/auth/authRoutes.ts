import * as Joi from 'joi';
import {AuthController} from "./authController";

export function authRoute() {
    return [
        {
            method: 'POST',
            path: '/auth/register',
            config: {
                tags: ['api'], // section in documentation
                validate: {
                    payload: {
                        jwt_token: Joi.string().max(4000).required().description('JWT token from Google')
                    }
                },
            },
            handler: (request) => {
                return AuthController.register({
                    jwtToken: request.payload.jwt_token
                })
            }


        }

    ];
}