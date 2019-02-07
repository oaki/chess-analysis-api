import {Connection, ConnectionOptions, getConnectionManager} from "typeorm";
import {getConfig} from "../config";

export async function connectEvaluationDatabase(): Promise<Connection> {
    const config = getConfig();

    try {
        const connectionManager = getConnectionManager();
        const options: ConnectionOptions = {
            type: "postgres",
            host: config.evaluationDatabase.host,
            port: Number(config.evaluationDatabase.port),
            username: config.evaluationDatabase.user,
            password: config.evaluationDatabase.password,
            database: config.evaluationDatabase.database,

            synchronize: true,
            logging: true,

            "entities": [
                "dist/modules/evaluatedDatabase/entity/**/*.js",
                "dist/modules/gameDatabase/entity/**/*.js",
            ],
        };

        const connection = connectionManager.create(options);

        return await connection.connect();
    } catch (e) {
        console.log("Can not connect to connectEvaluationDatabase", e);
    }

}

export const evaluationConnection = connectEvaluationDatabase();