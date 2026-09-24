import Joi from "joi";
import {EvaluationDatabaseController} from "./evaluationDatabaseController";
import * as Boom from "@hapi/boom";
import {ParseController} from "./parse/parseController";
import {getBasePath} from "../../config";
import * as fs from "fs";
import {evaluationConnection} from "../../libs/connectEvaluationDatabase";
import {importPgnContent} from "../bestMoves/import/pgnBestMovesImporter";
import {DEFAULT_IMPORT_THRESHOLDS} from "../bestMoves/import/importFilter";
import {MINIMUM_CONFIRMATIONS} from "../bestMoves/import/consensus";
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

        {
            method: "POST",
            path: "/evaluation-database/best-moves/{name}",
            config: {
                description: "Import a TCEC/CCRL-annotated PGN file into the best_move consensus cache "
                    + "(see docs/adr/0001-best-moves-cache.md). Positions only land in best_move when "
                    + "multiple independent engines agree on the move.",
                tags: ["api"],
                validate: {
                    params: Joi.object({
                        name: Joi.string().max(60).required().description("PGN filename under games/evaluation/"),
                    }),
                    query: Joi.object({
                        source: Joi.string().max(50).required().description("Source lookup name, e.g. TCEC"),
                        minConfirmations: Joi.number().integer().min(1).optional().default(MINIMUM_CONFIRMATIONS)
                            .description("Distinct agreeing engines required before a position is written. "
                                + "Lower to 1 for a source that structurally can't produce two independent "
                                + "opinions, e.g. a TCEC superfinal (a head-to-head match between two "
                                + "engines) — the import filter's node/eval thresholds still apply."),
                    }),
                },
            },

            handler: async (request) => {
                const filePath = `${getBasePath()}/games/evaluation/${request.params["name"]}`;
                const content = await fs.promises.readFile(filePath, "utf-8");
                const db = await evaluationConnection();

                return await importPgnContent(
                    db,
                    request.query["source"],
                    content,
                    DEFAULT_IMPORT_THRESHOLDS,
                    request.query["minConfirmations"],
                );
            },
        },
    ];
}
