import {evaluationConnection} from "./libs/connectEvaluationDatabase";
import {ImportedGames} from "./modules/evaluatedDatabase/entity/importedGames";
import {postgreGameDbConnection} from "./libs/connectPostgreGameDatabase";
import {getConfig} from "./config";
import {ConnectionOptions, getConnectionManager} from "typeorm";
import {Move} from "./modules/postgreGameDatabase/entity/move";
import {Game} from "./modules/postgreGameDatabase/entity/game";

const connectionManager = getConnectionManager();

const options: ConnectionOptions = {
    type: 'mariadb',
    host:'mariadb105.websupport.sk',
    port: 3315,
    username: 'chess_db_v4',
    password: 'Je2tba6Gn_',
    database: 'chess_db_v4',
    // connectTimeoutMS: 4000,
    synchronize: true,
    logging: true,
    // logNotifications: false,

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
const postgreOptions: ConnectionOptions = {
    type: 'postgres',
    host: 'postgresql.websupport.sk',
    port: 5432,
    username: 'chess_db_v2',
    password: 'EP2AWCH50Xp',
    database: 'chess_db_v2',
    connectTimeoutMS: 4000,
    synchronize: false,
    logging: true,
    logNotifications: false,

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

const connectionMysql = connectionManager.create(options);
const connectionPostgre = connectionManager.create(postgreOptions);


async function init(){
    const db1 = await connectionMysql.connect();
    const db2 = await connectionPostgre.connect();

    const game = await db2.getRepository(Game)
        .createQueryBuilder("game")
        .select("*")
        .limit(10).getMany();

    console.log({game});
}

init();