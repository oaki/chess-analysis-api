import {config, getConfig} from "../../config";
import {BaseResponse} from "../../libs/baseResponse";
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
                    // refresh_token: props.refreshToken,
                });
            }

            const token = JWT.sign({
                user_id: await userInstance.get('id')
            }, config.jwt.key);

            console.log('token', token);
            return {
                token: token
            };

        } catch (e) {
            console.log(e);
            throw Boom.forbidden('User is not valid')
        }


        // These six fields are included in all Google ID Tokens.
        // "iss": "https://accounts.google.com",
        //     "sub": "110169484474386276334",
        //     "azp": "1008719970978-hb24n2dstb40o45d4feuo2ukqmcc6381.apps.googleusercontent.com",
        //     "aud": "1008719970978-hb24n2dstb40o45d4feuo2ukqmcc6381.apps.googleusercontent.com",
        //     "iat": "1433978353",
        //     "exp": "1433981953",
        //
        //     // These seven fields are only included when the user has granted the "profile" and
        //     // "email" OAuth scopes to the application.
        //     "email": "testuser@gmail.com",
        //     "email_verified": "true",
        //     "name" : "Test User",
        //     "picture": "https://lh4.googleusercontent.com/-kYgzyAWpZzJ/ABCDEFGHI/AAAJKLMNOP/tIXL9Ir44LE/s99-c/photo.jpg",
        //     "given_name": "Test",
        //     "family_name": "User",
        //     "locale": "en"

    }
}

interface IRegisterProps {
    jwtToken: string;
    email: string;
}