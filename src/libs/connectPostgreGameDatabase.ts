import {Connection, ConnectionOptions, getConnectionManager} from "typeorm";
import {getConfig} from "../config";

require("dotenv").config();

const config = getConfig();

const connectionManager = getConnectionManager();

const options: ConnectionOptions = {
    type: config.postgreGameDatabase.type as any,
    host: config.postgreGameDatabase.host,
    port: Number(config.postgreGameDatabase.port),
    username: config.postgreGameDatabase.user,
    password: config.postgreGameDatabase.password,
    database: config.postgreGameDatabase.database,
    connectTimeoutMS: 4000,
    synchronize: config.postgreGameDatabase.synchronize,
    logging: true,
    logNotifications: true,

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