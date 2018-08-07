import {DataTypes, Instance, Sequelize} from "sequelize";

module.exports = function LogModel(sequelize: Sequelize, dataTypes: DataTypes) {
    return sequelize.define("logs", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        data: {type: Sequelize.TEXT},
        uuid: {type: Sequelize.STRING},
    });
};

export interface LogAttributes {
    id?: number;
    data: string;
    uuid: string;
}

export interface LogInstance extends Instance<LogAttributes> {
    dataValues: LogAttributes;
}