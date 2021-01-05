import {Connection, ConnectionOptions, getConnectionManager} from "typeorm";
import {getConfig} from "../config";

const config = getConfig();

const connectionManager = getConnectionManager();
const options: ConnectionOptions = {
    type: config.evaluationDatabase.type as any,
    host: config.evaluationDatabase.host,
    port: Number(config.evaluationDatabase.port),
    username: config.evaluationDatabase.user,
    password: config.evaluationDatabase.password,
    database: config.evaluationDatabase.database,

    synchronize: config.evaluationDatabase.synchronize,
    logging: true,

    "entities": [
        "dist/modules/evaluatedDatabase/entity/**/*.js",
    ],
};

const connection = connectionManager.create(options);

const db = connection.connect();

export async function evaluationConnection(): Promise<Connection> {
    const database = await db;
    if (database.isConnected) {
        return database;
    }

    throw new Error("Evaluation DB is NOT connected");
}
