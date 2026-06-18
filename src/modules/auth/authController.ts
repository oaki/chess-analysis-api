import {config, getConfig} from "../../config";
import * as Boom from "@hapi/boom";
import {BaseResponse} from "../../libs/baseResponse";
import {appDbConnection} from "../../libs/connectAppDatabase";
import {VerifyHash} from "../user/entity/verifyHash";
import {User} from "../user/entity/user";
import {logger} from "../../libs/logger";

import jwt, {Algorithm, SignOptions, JwtPayload} from "jsonwebtoken";
import {OAuth2Client} from "google-auth-library";
const clientId: string = getConfig().googleAuth.googleClientId;
const client = new OAuth2Client(clientId);

const uuid = require("uuid/v1");
export const tokenOptions: SignOptions = {
    algorithm: "HS256" as Algorithm,
    expiresIn: "200d",
}

export class AuthController {

    static async createTemporaryJwtToken() {
        const hash = uuid();

        const token = jwt.sign({hash}, config.jwt.key, tokenOptions);

        const db = await appDbConnection();
        await db.createQueryBuilder()
            .delete()
            .from(VerifyHash)
            .where("created_at < :time", {time: new Date(Date.now() - 60 * 60 * 1000)})
            .execute();

        await db.createQueryBuilder()
            .insert()
            .into(VerifyHash)
            .values({hash, token})
            .execute();

        return {token};
    }

    static async pairTemporaryToken(props: {
        temporaryToken: string;
        googleToken: string;
    }) {
        const decodedObj = jwt.verify(props.temporaryToken, config.jwt.key) as JwtPayload;

        if (decodedObj) {
            const db = await appDbConnection();
            const verifyHashRepository = await db.getRepository(VerifyHash);
            const res = await verifyHashRepository.findOne({where: {hash: decodedObj["hash"]}});

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
        const decodedObj = jwt.verify(props.temporaryToken, config.jwt.key) as JwtPayload;

        const db = await appDbConnection();
        const verifyHashRepository = await db.getRepository(VerifyHash);

        const res = await verifyHashRepository.findOne({where: {hash: decodedObj["hash"]}});

        if (res && res.google_token) {
            return {
                status: "success",
                google_token: res.google_token
            };
        }

        throw Boom.notFound("Hash is not found");
    }

    static async createJwtToken(props: IRegisterProps) {
        try {
            const ticket = await client.verifyIdToken({
                idToken: props.jwtToken,
                audience: clientId,
            });
            const payload = ticket.getPayload();
            const google_user_id = payload.sub;
            const email = payload.email;

            const db = await appDbConnection();
            const userRepository = await db.getRepository(User);

            let user = await userRepository.findOne({
                where: {google_user_id, email}
            });

            if (!user) {
                const newUser = new User();
                newUser.google_user_id = google_user_id;
                newUser.email = email;
                newUser.name = payload.name;
                newUser.picture = payload.picture;
                newUser.given_name = payload.given_name;
                newUser.family_name = payload.family_name;
                newUser.locale = payload.locale;
                await userRepository.save(newUser);

                user = await userRepository.findOne({where: {google_user_id, email}});
            }

            logger.info({userId: user.id, email: user.email}, "user signed in");

            const token = jwt.sign({
                user_id: user.id,
                email: user.email,
                name: user.name,
                img: payload.picture,
            }, config.jwt.key, tokenOptions);

            return {token};
        } catch (e) {
            logger.warn({err: e}, "invalid Google token");
            throw Boom.forbidden("User is not valid");
        }
    }
}

interface IRegisterProps {
    jwtToken: string;
}

interface CheckTemporaryTokenProps {
    temporaryToken: string;
}
