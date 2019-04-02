import * as Joi from "joi";
import {EvaluationDatabaseController} from "./evaluationDatabaseController";
import * as Boom from "boom";
import {ParseController} from "./parse/parseController";

const evaluationDatabaseController = new EvaluationDatabaseController();
const parseController = new ParseController();

export function evaluationDatabaseRoute() {
    return [
        {
            method: "GET",
            path: "/evaluation-database/{name}",
            config: {
                description: "Filename",
                tags: ["api"], // section in documentation,
                validate: {
                    params: {
                        name: Joi.string().max(30).required().description("File name for import")
                    }
                },
            },

            handler: async (request: any) => {
                evaluationDatabaseController.loadFile(request.params["name"], async (game) => {
                    await evaluationDatabaseController.importToMysql(game);
                });
                try {

                } catch (e) {
                    Boom.badData("Something went wrong");
                }


                return {
                    status: "ok"
                };

            }
        },

        {
            method: "GET",
            path: "/evaluation-database/parse-db",
            config: {
                description: "Parse",
                tags: ["api"], // section in documentation,
                validate: {},
            },

            handler: async () => {

                return await parseController.do({
                    offset: 0,
                    limit: 100
                })
            }
        },
    ];
}