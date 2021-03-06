import {config} from "../../config";

const Joi = require("@hapi/joi");
import {AuthController, tokenOptions} from "./authController";
const JWT = require("jsonwebtoken");

export function authRoute() {
    return [
        {
            method: "POST",
            path: "/auth/register",
            config: {
                tags: ["api"], // section in documentation
                validate: {
                    payload: {
                        jwt_token: Joi.string().max(4000).required().description("JWT token from Google")
                    }
                },
            },
            handler: (request) => {
                return AuthController.createJwtToken({
                    jwtToken: request.payload.jwt_token
                })
            }


        },

        {
            method: "GET",
            path: "/auth/temporary-session",
            config: {
                tags: ["api"], // section in documentation
            },
            handler: () => {
                return AuthController.createTemporaryJwtToken()
            }
        },

        {
            method: "POST",
            path: "/auth/pair-temporary-session",
            config: {
                tags: ["api"], // section in documentation
            },
            handler: (request) => {


                const payload = JSON.parse(request.payload);
                console.log({payload});
                return AuthController.pairTemporaryToken({
                    googleToken: payload.google_token,
                    temporaryToken: payload.temporary_token,
                })
            }
        },
        {
            method: "POST",
            path: "/auth/check-temporary-token",
            config: {
                tags: ["api"], // section in documentation
            },
            handler: async (request) => {
                const payload = JSON.parse(request.payload);
                console.log({payload});
                return await AuthController.checkTemporaryToken({
                    temporaryToken: payload.temporary_token,
                })
            }
        },
        // {
        //     method: "POST",
        //     path: "/auth/registerRaspberry",
        //     config: {
        //         tags: ["api"], // section in documentation
        //     },
        //     handler: async (request) => {
        //
        //         const token = JWT.sign({
        //             user_id: 1,
        //             email: 'pavolbincik@gmail.com',
        //             name: 'pavolbincik',
        //             img: '',
        //         }, config.jwt.key, tokenOptions);
        //         return token;
        //     }
        //
        //
        // },

    ];
}