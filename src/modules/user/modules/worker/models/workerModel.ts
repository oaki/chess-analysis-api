import {Sequelize, DataTypes, Instance} from "sequelize";

module.exports = function WorkerModel(sequelize: Sequelize, dataTypes: DataTypes) {
    return sequelize.define('worker', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        user_id: {
            type: Sequelize.INTEGER
        },
        uuid: {
            type: Sequelize.STRING,
        },
        name: {
            type: Sequelize.STRING,
        },
        score: {
            type: Sequelize.FLOAT,
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