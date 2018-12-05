import {DataTypes, Instance, Sequelize} from "sequelize";

module.exports = function EvaluatedPositionModel(sequelize: Sequelize, dataTypes: DataTypes) {
    return sequelize.define("evaluated_position", {
        fen: {
            type: Sequelize.STRING,
            primaryKey: true,
        },
        data: {type: Sequelize.TEXT},
    },{
        timestamps: false,
        paranoid: false,
    });
};

export interface EvaluatedPositionAttributes {
    fen: string;
    data: string;
}

export interface EvaluatedPositionInstance extends Instance<EvaluatedPositionAttributes> {
    dataValues: EvaluatedPositionAttributes;
}