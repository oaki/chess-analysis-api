import {gameDatabase} from "./gameDatabase";
import {database} from "./mysql";
import {IConfig} from "./index";
import {googleAuth} from "./googleAuth";
import {evaluationDatabase} from "./evaluationDatabase";

require("dotenv").config();

export enum Environment {
    "PRODUCTION" = "production",
    "DEVELOPMENT" = "development",
}

export const config: IConfig = {
    environment: process.env.APP_ENVIRONMENT === Environment.DEVELOPMENT ? Environment.DEVELOPMENT : Environment.PRODUCTION,
    swagger: {host: process.env.SWAGGER_HOST},
    server: {
        port: Number(process.env.SERVER_PORT),
    },
    io: {
        port: Number(process.env.IO_PORT),
    },

    jwt: {
        key: process.env.JWT_KEY
    },
    database,
    gameDatabase,
    evaluationDatabase,

    googleAuth,

    nextChessMoveCookie: process.env.NEXT_CHESS_MOVE_COOKIE
}


export interface IConfig {
    server: { port: number },
    io: { port: number },
    database: {
        database: string,
        user: string,
        password: string,
        dialect: string,
        host: string,
        port: string
    },
    evaluationDatabase: {
        database: string,
        user: string,
        password: string,
        type: string,
        host: string,
        port: string,
        synchronize: boolean;
    },
    gameDatabase: {
        type: string,
        host: string,
        database: string,
        user: string,
        password: string,
        port: number,
        synchronize: boolean
    },
    googleAuth: {
        baseUrl: string;
        redirectUrl: string;
        googleClientId: string;
        googleClientSecret: string;
    },

    jwt: {
        key: string;
    },

    environment: Environment,
    swagger: {
        host: string;
    },

    nextChessMoveCookie: string;
}


export function getConfig(): IConfig {
    return config;
}

export function getBasePath() {
    return process.cwd();
}

export function isDev() {
    return config.environment === Environment.DEVELOPMENT;
}