import {Connection, ConnectionOptions, getConnectionManager} from "typeorm";
import {getConfig} from "../config";

require("dotenv").config();

const config = getConfig();

const connectionManager = getConnectionManager();

const options: ConnectionOptions = {
    type: config.gameDatabase.type as any,
    host: config.gameDatabase.host,
    port: Number(config.gameDatabase.port),
    username: config.gameDatabase.user,
    password: config.gameDatabase.password,
    database: config.gameDatabase.database,
    connectTimeoutMS: 4000,
    synchronize: config.gameDatabase.synchronize,
    logging: true,
    logNotifications: false,

    "entities": [
        "dist/modules/postgreGameDatabase/entity/**/*.js"
    ],
    "migrations": [
        "dist/modules/postgreGameDatabase/migration/**/*.js"
    ],
    "subscribers": [
        "dist/modules/postgreGameDatabase/subscriber/**/*.js"
    ],
};

console.log("POSTGRE CONFIG", options);

const connection = connectionManager.create(options);

const db = connection.connect();

export async function postgreGameDbConnection(): Promise<Connection> {
    const database = await db;
    if (database.isConnected) {
        return database;
    }

    throw new Error("PostgreGameDb DB is NOT connected");
}