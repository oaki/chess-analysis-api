import {config, getConfig} from "../../config";
import * as Boom from "boom";
import {models} from "../../models/database";

const JWT = require('jsonwebtoken');
const {OAuth2Client} = require('google-auth-library');
const clientId: string = getConfig().googleAuth.googleClientId;
const client = new OAuth2Client(clientId);

export class AuthController {

    static async register(props: IRegisterProps) {
        try {
            const ticket = await client.verifyIdToken({
                idToken: props.jwtToken,
                audience: clientId,  // Specify the CLIENT_ID of the app that accesses the backend
                // Or, if multiple clients access the backend:
                //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
            });
            const payload = ticket.getPayload();
            const userid = payload.sub;

            let userInstance = await models.User.findOne({
                where: {
                    google_user_id: userid,
                    email: props.email
                }
            });

            if (!userInstance) {
                //register
                userInstance = await models.User.create({
                    google_user_id: userid,
                    name: payload.name,
                    email: payload.email,
                    picture: payload.picture,
                    given_name: payload.given_name,
                    family_name: payload.family_name,
                    locale: payload.locale,
                });
            }

            const tokenOptions = {
                algorithm: 'HS256',
                expiresIn: '30d',
            }

            const token = JWT.sign({
                user_id: await userInstance.get('id')
            }, config.jwt.key, tokenOptions);

            console.log('token', token);
            return {
                token: token
            };

        } catch (e) {
            console.log(e);
            throw Boom.forbidden('User is not valid')
        }
    }
}

interface IRegisterProps {
    jwtToken: string;
    email: string;
}