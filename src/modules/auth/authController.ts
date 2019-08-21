import {config, getConfig} from "../../config";
import * as Boom from "boom";
import {BaseResponse} from "../../libs/baseResponse";
import {appDbConnection} from "../../libs/connectAppDatabase";
import {VerifyHash} from "../user/entity/verifyHash";
import {User} from "../user/entity/user";

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

        const db = await appDbConnection;
        await db.createQueryBuilder()
            .delete()
            .from(VerifyHash)
            .where("created_at < :time", {time: new Date(Date.now() - 60 * 60 * 1000)})
            .execute();

        await db.createQueryBuilder()
            .insert()
            .into(VerifyHash)
            .values({
                hash,
                token
            })
            .execute();

        return {token};
    }

    static async pairTemporaryToken(props: {
        temporaryToken: string;
        googleToken: string;
    }) {

        const decodedObj = JWT.decode(props.temporaryToken, config.jwt.key, tokenOptions);
        console.log({decodedObj, props});

        if (decodedObj) {

            const db = await appDbConnection;
            const verifyHashRepository = await db.getRepository(VerifyHash);
            const res = await verifyHashRepository.findOne({where: {hash: decodedObj.hash}});

            if (res) {

                res.google_token = props.googleToken;
                await verifyHashRepository.save(res);

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

        const db = await appDbConnection;
        const verifyHashRepository = await db.getRepository(VerifyHash);

        const res = await verifyHashRepository.findOne({
            where: {
                hash: decodedObj.hash
            }
        });

        if (res && res.google_token) {
            // console.log({google_token: res["google_token"]});
            // return await AuthController.createJwtToken({
            //     jwtToken: res["google_token"]
            // })

            return {
                status: "success",
                google_token: res.google_token
            };
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
            const google_user_id = payload.sub;
            const email = payload.email;


            const db = await appDbConnection;
            const userRepository = await db.getRepository(User);

            const res = await userRepository.findOne({
                where: {
                    google_user_id: google_user_id,
                    email: email
                }
            });

        debugger;
            if (!res) {
                //register

                const user = new User();
                user.google_user_id = google_user_id;
                user.email = email;
                user.name = payload.name;
                user.picture = payload.picture;
                user.given_name = payload.given_name;
                user.family_name = payload.family_name;
                user.locale = payload.locale;

                await userRepository.save(user);
            }

            const user = await userRepository.findOne({
                where: {
                    google_user_id: google_user_id,
                    email: email
                }
            });

            console.log({signInUser: user});

            const token = JWT.sign({
                user_id: user.id,
                email: user.email,
                name: user.name,
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