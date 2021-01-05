import {Connection, ConnectionOptions, getConnectionManager} from "typeorm";
import {getConfig} from "../config";

const config = getConfig();
// MysqlConnectionOptions | PostgresConnectionOptions

const connectionManager = getConnectionManager();
const options: ConnectionOptions = {
    type: config.appDatabase.type as any,
    host: config.appDatabase.host,
    port: Number(config.appDatabase.port),
    username: config.appDatabase.user,
    password: config.appDatabase.password,
    database: config.appDatabase.database,

    synchronize: config.appDatabase.synchronize,
    logging: false,

    "entities": [
        "dist/modules/user/entity/**/*.js"
    ],
    "migrations": [
        "dist/modules/user/migration/**/*.js"
    ],
    "subscribers": [
        "dist/modules/user/subscriber/**/*.js"
    ],
};

const connection = connectionManager.create(options);
const db = connection.connect();

export async function appDbConnection(): Promise<Connection> {
    console.log('GET APP CONNECTION');
    const database = await db;
    if (database.isConnected) {
        return database;
    }

    throw new Error("App DB is NOT connected");
}
