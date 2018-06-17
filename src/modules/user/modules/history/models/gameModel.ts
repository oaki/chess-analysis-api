import {Sequelize, DataTypes, Instance} from "sequelize";

module.exports = function GameModel(sequelize: Sequelize, dataTypes: DataTypes) {
    return sequelize.define('game', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        user_id: {type: Sequelize.INTEGER},
        moves: {type: Sequelize.TEXT},
    });
};

export interface GameAttributes {
    id?: number;
    user_id: string;
    moves: string;
}

export interface GameInstance extends Instance<GameAttributes> {
    dataValues: GameAttributes;
}