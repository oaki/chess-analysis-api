import {config} from "./config";

const Sequelize = require('sequelize');

let dbInstance;

export class Database {

    constructor() {
        throw new Error('Use getDb.');

    }

    static getDb() {
        if (!dbInstance) {
            dbInstance = new Sequelize(config.database.database, config.database.user, config.database.password, {
                host: config.database.host,
                dialect: config.database.dialect,
            });
        }

        return dbInstance;
    }
}