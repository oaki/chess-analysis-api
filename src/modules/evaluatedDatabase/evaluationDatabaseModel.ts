import {DataTypes, Instance, Sequelize} from "sequelize";

module.exports = function ImportGameModel(sequelize: Sequelize, dataTypes: DataTypes) {
    return sequelize.define('import_games', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        event: {type: Sequelize.STRING},
        event_date: {type: Sequelize.DATE},
        white_name: {type: Sequelize.STRING},
        black_name: {type: Sequelize.STRING},
        result: {type: Sequelize.STRING},
        black_elo: {type: Sequelize.STRING},
        white_elo: {type: Sequelize.STRING},
        opening: {type: Sequelize.STRING},
        moves: {type: Sequelize.TEXT},
        isParsed: {type: Sequelize.BOOLEAN},
    });
};

export interface ImportGameAttributes {
    id?: number;
    comment_id: number;
    user_id: number;
    title: string;
    text: string;
}

export interface ImportGameInstance extends Instance<ImportGameAttributes> {
    dataValues: ImportGameAttributes;
}