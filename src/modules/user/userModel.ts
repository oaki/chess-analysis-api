import {Sequelize, DataTypes, Instance} from "sequelize";

module.exports = function UserModel(sequelize: Sequelize, dataTypes: DataTypes) {
    return sequelize.define('user', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        google_user_id: {type: Sequelize.STRING},
        name: {type: Sequelize.STRING},
        email: {type: Sequelize.STRING},
        picture: {type: Sequelize.STRING},
        given_name: {type: Sequelize.STRING},
        family_name: {type: Sequelize.STRING},
        locale: {type: Sequelize.STRING},
        // refresh_token: {type: Sequelize.STRING},
    });
};

export interface UserAttributes {
    id?: number;
    google_user_id: string;
    name: string;
    email: string;
    picture: string;
    given_name: string;
    family_name: string;
    locale: string;
    // refresh_token: string;
}

export interface UserInstance extends Instance<UserAttributes> {
    dataValues: UserAttributes;
}