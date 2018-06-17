import {Sequelize, DataTypes, Instance} from "sequelize";

module.exports = function WorkerModel(sequelize: Sequelize, dataTypes: DataTypes) {
    return sequelize.define('worker', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        user_id: {type: Sequelize.INTEGER},
        uuid: {
            type: Sequelize.STRING,
            unique: true
        },
        name: {
            type: Sequelize.STRING,
        },
    });
};

export interface WorkerAttributes {
    id?: number;
    user_id: number;
    uuid: string;
    name: string;
}

export interface WorkerInstance extends Instance<WorkerAttributes> {
    dataValues: WorkerAttributes;
}