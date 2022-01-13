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
        "dist/modules/gameDatabase/entity/**/*.js"
    ],
    "migrations": [
        "dist/modules/gameDatabase/migration/**/*.js"
    ],
    "subscribers": [
        "dist/modules/gameDatabase/subscriber/**/*.js"
    ],
};

console.log("MYSQL DB_V4 CONFIG", options);

const connection = connectionManager.create(options);

const db = connection.connect();

export async function gameDbConnection(): Promise<Connection> {
    const database = await db;
    if (database.isConnected) {
        return database;
    }

    throw new Error("GameDb DB is NOT connected");
}