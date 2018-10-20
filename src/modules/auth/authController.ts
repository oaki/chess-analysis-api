import {config, getConfig} from "../../config";
import * as Boom from "boom";
import {models, sequelize} from "../../models/database";
import {BaseResponse} from "../../libs/baseResponse";

const JWT = require("jsonwebtoken");
const {OAuth2Client} = require("google-auth-library");
const clientId: string = getConfig().googleAuth.googleClientId;
const client = new OAuth2Client(clientId);

const uuid = require("uuid/v1");
export const tokenOptions = {
    algorithm: "HS256",
    expiresIn: "200d",
}


export class AuthController {

    static async createTemporaryJwtToken() {
        const hash = uuid();

        const token = JWT.sign({
            hash: hash,
        }, config.jwt.key, tokenOptions);

        console.log("token", token);

        await models.VerifyHash.destroy({
            where: {
                created_at: {
                    [sequelize.Op.lt]: new Date(Date.now() - 60 * 60 * 1000),
                }
            }
        });
        await models.VerifyHash.create({
            hash,
            token
        });

        return {token};
    }

    static async pairTemporaryToken(props: {
        temporaryToken: string;
        googleToken: string;
    }) {

        const decodedObj = JWT.decode(props.temporaryToken, config.jwt.key, tokenOptions);
        console.log({decodedObj, props});

        if (decodedObj) {
            const verifyInstance = await models.VerifyHash.findOne({
                where: {
                    hash: decodedObj.hash
                }
            });

            if (verifyInstance) {
                const toSave = {
                    google_token: props.googleToken
                };
                console.log({toSave, decodedObj});
                await verifyInstance.update(toSave);
                return BaseResponse.getSuccess();
            } else {
                throw Boom.forbidden("Session is not found");
            }
        }

        throw Boom.forbidden("Token is not valid");
    }

    static async checkTemporaryToken(props: CheckTemporaryTokenProps) {

        const decodedObj = await JWT.decode(props.temporaryToken, config.jwt.key, tokenOptions);
        console.log({decodedObj, props});

        const verifyHash = await models.VerifyHash.findOne({
            where: {
                hash: decodedObj.hash
            }
        });

        if (verifyHash) {
            console.log({google_token: verifyHash["google_token"]});
            return await AuthController.createJwtToken({
                jwtToken: verifyHash["google_token"]
            })

        }

        throw Boom.notFound("Hash is not found")
    }

    static async createJwtToken(props: IRegisterProps) {
        try {
            console.log("createJwtToken", {props});
            const ticket = await client.verifyIdToken({
                idToken: props.jwtToken,
                audience: clientId,  // Specify the CLIENT_ID of the app that accesses the backend
                // Or, if multiple clients access the backend:
                //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
            });
            const payload = ticket.getPayload();
            console.log(payload);
            const userid = payload.sub;
            const email = payload.email;

            let userInstance = await models.User.findOne({
                where: {
                    google_user_id: userid,
                    email: email
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

            const token = JWT.sign({
                user_id: await userInstance.get("id"),
                email: await userInstance.get("email"),
                name: await userInstance.get("name"),
                img: payload.imageUrl,
            }, config.jwt.key, tokenOptions);

            console.log("token", token);
            return {
                token: token
            };

        } catch (e) {
            console.log(e);
            throw Boom.forbidden("User is not valid")
        }
    }
}

interface IRegisterProps {
    jwtToken: string;
}

interface CheckTemporaryTokenProps {
    temporaryToken: string;
}