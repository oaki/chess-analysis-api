import {getConnectionManager} from "typeorm";
import {getConfig} from "../config";

export async function connectGameDatabase() {
    const config = getConfig();

    const connectionManager = getConnectionManager();
    const connection = connectionManager.create({
        type: "postgres",
        host: config.gameDatabase.host,
        port: config.gameDatabase.port,
        username: config.gameDatabase.user,
        password: config.gameDatabase.password,
        database: config.gameDatabase.database,

        synchronize: true,
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
    });
    return await connection.connect();

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