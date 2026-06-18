import Joi from "joi";
import {EvaluationDatabaseController} from "./evaluationDatabaseController";
import * as Boom from "@hapi/boom";
import {ParseController} from "./parse/parseController";
import {getBasePath} from "../../config";
import * as fs from "fs";
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
                    params: Joi.object({
                        name: Joi.string().max(30).required().description("File name for import")
                    })
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

                return {status: "ok"};
            }
        },
        {
            method: "GET",
            path: "/evaluation-database/parse-dir",
            config: {
                description: "Parse dir",
                tags: ["api"], // section in documentation,
            },

            handler: async () => {
                const dirname = `${getBasePath()}/games/evaluation/`;

                fs.readdir(dirname, async (err, items) => {
                    for (let i = 0; i < items.length; i++) {
                        const filename = `${items[i]}`;
                        if (filename.indexOf(".gitkeep") === -1) {
                            evaluationDatabaseController.loadFile(filename, async (game) => {
                                await evaluationDatabaseController.importToMysql(game);
                            });
                        }
                    }
                });

                return {status: "ok"};
            }
        },

        {
            method: "GET",
            path: "/evaluation-database/parse-db",
            config: {
                description: "Parse",
                tags: ["api"], // section in documentation,
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
