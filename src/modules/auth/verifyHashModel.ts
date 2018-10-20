import {DataTypes, Instance, Sequelize} from "sequelize";

module.exports = function VerifyHashModel(sequelize: Sequelize, dataTypes: DataTypes) {
    return sequelize.define("verify_hash", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        hash: {type: Sequelize.STRING},
        token: {type: Sequelize.TEXT},
        google_token: {type: Sequelize.TEXT},
    });
};

export interface VerifyHashAttributes {
    id?: number;
    hash: string;
    token: string;
    google_token: string;
}

export interface VerifyHashInstance extends Instance<VerifyHashAttributes> {
    dataValues: VerifyHashAttributes;
}