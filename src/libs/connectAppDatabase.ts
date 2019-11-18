import {Connection, ConnectionOptions, getConnectionManager} from "typeorm";
import {getConfig} from "../config";

export async function connectAppDatabase(): Promise<Connection> {
    const config = getConfig();
    // MysqlConnectionOptions | PostgresConnectionOptions
    try {
        const connectionManager = getConnectionManager();
        const options: ConnectionOptions = {
            type: config.appDatabase.type as any,
            host: config.appDatabase.host,
            port: Number(config.appDatabase.port),
            username: config.appDatabase.user,
            password: config.appDatabase.password,
            database: config.appDatabase.database,

            synchronize: config.appDatabase.synchronize,
            logging: true,

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

        return await connection.connect();
    } catch (e) {
        console.log("Can not connect to Games Database", e);
    }

}

export const appDbConnection = connectAppDatabase();