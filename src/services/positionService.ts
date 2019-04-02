import {isDev} from "../config";
import {IEvaluation, LINE_MAP} from "../interfaces";
import {countPieces} from "../tools";
import {evaluationConnection} from "../libs/connectEvaluationDatabase";
import {EvaluatedPosition} from "../modules/evaluatedDatabase/entity/evaluatedPosition";
import {decodeFenHash} from "../libs/fenHash";
import {Connection} from "typeorm";

export class PositionService {

    readonly saveCriterium;
    private db: Connection;

    constructor() {
        this.saveCriterium = {
            // depth: 28,
            nodes: 80 * 1000 * 1000, //27 666 454 250 e.g. 1 629 921 584
            maxScore: 2.5,
        };

        console.log("isDev()", isDev());
        if (isDev()) {

            this.saveCriterium = {
                depth: 10,
                nodes: 10 * 100000,
                maxScore: 3.5,
            };

            console.log("saveCriterium", this.saveCriterium);
        }

        this.initConnection();
    }

    async initConnection() {
        this.db = await evaluationConnection;
    }

    checkEvaluation(fen: string, evaluation: IEvaluation) {
        const depth: number = Number(evaluation[LINE_MAP.depth]);
        const nodes = Number(evaluation[LINE_MAP.nodes]);
        const score = Math.abs(Number(evaluation[LINE_MAP.score]));
        const piecesCount = countPieces(fen);
        const isMate = !!evaluation[LINE_MAP.mate];
        console.log("TEST:", {
            depth,
            nodes,
            score
        });
        if (
            piecesCount > 7
            // && depth > this.saveCriterium.depth
            && !isMate
            && (
                nodes >= this.saveCriterium.nodes
                || evaluation[LINE_MAP.import]
            )
            && score < this.saveCriterium.maxScore
            && !!evaluation[LINE_MAP.pv]
        ) {
            console.log("Interesting evaluation: ", evaluation);

            return true;
        }
        return false;
    }

    async add(fen, evaluation: IEvaluation) {

        if (this.checkEvaluation(fen, evaluation)) {
            const fenHash = decodeFenHash(fen);

            const position = await this.db.getRepository(EvaluatedPosition)
                .createQueryBuilder("p")
                .where({fenHash})
                .orderBy("p.nodes", "DESC")
                .getOne();


            console.log("add", {evaluation});

            const values = {
                fen: fen,
                fenHash: fenHash,
                depth: Number(evaluation[LINE_MAP.depth]),
                score: Number(evaluation[LINE_MAP.score]),
                nodes: Math.round(evaluation[LINE_MAP.nodes] / 1000000),
                time: Number(evaluation[LINE_MAP.time]),
                import: !!evaluation[LINE_MAP.import],
                tbhits: evaluation[LINE_MAP.tbhits] ? Number(evaluation[LINE_MAP.tbhits]) : 0,
                pv: evaluation[LINE_MAP.pv]
            };


            if (!position || position.nodes < values.nodes) {
                this.db.createQueryBuilder()
                    .insert()
                    .into(EvaluatedPosition)
                    .values(values)
                    .execute();
            }

        } else {
            console.log("No reason to save this low analyse or there are less figures than 7", evaluation, "count:", countPieces(fen));
        }
    }

    // public mapWorkerToEvaluation(workerResponse: IEvaluation): IEvaluation {
    //     return {
    //         [LINE_MAP.score]: workerResponse[LINE_MAP.score],
    //         [LINE_MAP.depth]: workerResponse[LINE_MAP.depth],
    //         [LINE_MAP.pv]: workerResponse[LINE_MAP.pv],
    //         [LINE_MAP.nodes]: workerResponse[LINE_MAP.nodes],
    //         [LINE_MAP.multipv]: workerResponse[LINE_MAP.multipv],
    //         [LINE_MAP.time]: workerResponse[LINE_MAP.time],
    //         [LINE_MAP.nps]: workerResponse[LINE_MAP.nps],
    //         [LINE_MAP.tbhits]: workerResponse[LINE_MAP.tbhits],
    //     }
    // }

    async findAllMoves(fen) {
        const fenHash = decodeFenHash(fen);
        const position = await this.db.getRepository(EvaluatedPosition)
            .createQueryBuilder("p")
            .where({fenHash})
            .orderBy("p.nodes", "DESC")
            .getOne();

        if (position) {
            position.nodes = position.nodes * 1000000;
            return position;
        }

        return null;
    }

}

export default new PositionService();
