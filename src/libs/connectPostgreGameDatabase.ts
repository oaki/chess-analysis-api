import {Connection, ConnectionOptions, getConnectionManager} from "typeorm";
import {getConfig} from "../config";

require("dotenv").config();

export async function connectPostgreGameDatabase(): Promise<Connection> {
    const config = getConfig();

    try {
        const connectionManager = getConnectionManager();
        const options: ConnectionOptions = {
            type: config.postgreGameDatabase.type as any,
            host: config.postgreGameDatabase.host,
            port: config.postgreGameDatabase.port,
            username: config.postgreGameDatabase.user,
            password: config.postgreGameDatabase.password,
            database: config.postgreGameDatabase.database,

            synchronize: config.postgreGameDatabase.synchronize,
            logging: true,

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

        const connection = connectionManager.create(options);

        return await connection.connect();
    } catch (e) {
        console.log("Can not connect to Games Database", e);
    }

}

export const postgreGameDbConnection = connectPostgreGameDatabase();