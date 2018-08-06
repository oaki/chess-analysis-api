import {DataTypes, Instance, Sequelize} from "sequelize";

module.exports = function LogModel(sequelize: Sequelize, dataTypes: DataTypes) {
    return sequelize.define("import_games", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        log: {type: Sequelize.STRING},
    });
};

export interface LogAttributes {
    id?: number;
    log: string;
}

export interface LogInstance extends Instance<LogAttributes> {
    dataValues: LogAttributes;
}