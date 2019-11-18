import {Connection, ConnectionOptions, getConnectionManager} from "typeorm";

require("dotenv").config();

export async function connectPostgreGameDatabase(): Promise<Connection> {

    try {
        const connectionManager = getConnectionManager();
        const options: ConnectionOptions = {
            type: process.env.POSTGRE_DB_TYPE as any,
            host: process.env.POSTGRE_DB_HOST,
            port: process.env.POSTGRE_DB_PORT,
            username: process.env.POSTGRE_DB_USER,
            password: process.env.POSTGRE_DB_PASS,
            database: process.env.POSTGRE_DB_NAME,

            synchronize: false,
            logging: false,

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