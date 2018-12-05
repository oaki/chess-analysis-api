import {ConnectionOptions, getConnectionManager} from "typeorm";
import {getConfig} from "../config";

export async function connectGameDatabase() {
    const config = getConfig();

    try {
        const connectionManager = getConnectionManager();
        const options: ConnectionOptions = {
            type: "postgres",
            host: config.gameDatabase.host,
            port: config.gameDatabase.port,
            username: config.gameDatabase.user,
            password: config.gameDatabase.password,
            database: config.gameDatabase.database,

            synchronize: false,
            logging: true,

            "entities": [
                "dist/**/entity/**/*.js"
            ],
            "migrations": [
                "dist/migration/**/*.js"
            ],
            "subscribers": [
                "dist/subscriber/**/*.js"
            ],

            "cli": {
                "migrationsDir": "dist/models/migrations"
            }
        };

        const connection = connectionManager.create(options);

        return await connection.connect();
    } catch (e) {
        console.log("Can not connect to Games Database", e);
    }

}


// host: config.gameDatabase.host,
//     port: config.gameDatabase.port,
//     username: config.gameDatabase.user,
//     password: config.gameDatabase.password,
//     database: config.gameDatabase.database,
//     synchronize: true,
//     logging: true,
//
//     "entities": [
//     "dist/**/entity/**/*.js"
// ],
//     "migrations": [
//     "dist/migration/**/*.js"
// ],
//     "subscribers": [
//     "dist/subscriber/**/*.js"
// ],
//
//     "cli": {
//     "migrationsDir": "dist/models/migrations"
// }