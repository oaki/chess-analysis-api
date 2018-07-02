import * as Joi from "joi";
import {ImportsController} from "./importController";
import * as Boom from "boom";
import {ParseController} from "./parse/parseController";

const importController = new ImportsController();
const parseController = new ParseController();

export function importsRoute() {
    return [
        {
            method: "GET",
            path: "/imports/{name}",
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
                importController.loadFile(request.params["name"], async (game) => {
                    await importController.importToMysql(game);
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
            path: "/imports/parse",
            config: {
                description: "Parse",
                tags: ["api"], // section in documentation,
                validate: {},
            },

            handler: async (request: any) => {

                return await parseController.do({
                    offset: 0,
                    limit: 10
                })
            }
        },
    ];
}
