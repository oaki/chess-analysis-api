import * as SequelizeStatic from "sequelize";
import {ImportGameAttributes, ImportGameInstance} from "./importGameModel";
import {getConfig} from "../config";
import {UserAttributes, UserInstance} from "../modules/user/userModel";
import {GameAttributes, GameInstance} from "../modules/user/modules/history/models/gameModel";
import {WorkerAttributes, WorkerInstance} from "../modules/user/modules/worker/models/workerModel";

export interface SequelizeModels {
    ImportGame: SequelizeStatic.Model<ImportGameInstance, ImportGameAttributes>,
    User: SequelizeStatic.Model<UserInstance, UserAttributes>,
    Game: SequelizeStatic.Model<GameInstance, GameAttributes>,
    Worker: SequelizeStatic.Model<WorkerInstance, WorkerAttributes>,
}

const config = getConfig();
console.log('config', config);

class Database {
    private _sequelize: SequelizeStatic.Sequelize;

    private _models: SequelizeModels;

    constructor() {
        this._sequelize = new SequelizeStatic(config.database.database,
            config.database.user,
            config.database.password,
            {
                logging: console.log,
                dialect: config.database.dialect,
                host: config.database.host,
                port: config.database.port,
                define: {
                    charset: 'utf8',
                    collate: 'utf8_general_ci',
                    timestamps: true,
                    paranoid: true,
                    underscored: true
                }
            });

        this._models = {
            ImportGame: this._sequelize.import<ImportGameInstance, ImportGameAttributes>('./importGameModel'),
            User: this._sequelize.import<UserInstance, UserAttributes>('./../modules/user/userModel'),
            Game: this._sequelize.import<GameInstance, GameAttributes>('./../modules/user/modules/history/models/gameModel'),
            Worker: this._sequelize.import<WorkerInstance, WorkerAttributes>('./../modules/worker/workerModel'),
        };

        this._models.User.hasMany(this._models.Game);
        this._models.User.hasMany(this._models.Worker);

    }

    get models(): SequelizeModels {
        return this._models;
    }

    get sequelize(): SequelizeStatic.Sequelize {
        return this._sequelize;
    }

    async sync(options: {}) {
        try {
            return await this._sequelize.sync(options);
        }
        catch (err) {
            console.error('sync error: ', err);
        }
    }
}

const database = new Database();
export const models = database.models;
export const sequelize = database.sequelize;

export const sync = database.sync.bind(database);

// sync();
