import {IEvaluation, LINE_MAP} from "../interfaces";
import {countPieces} from "../tools";
import {evaluationConnection} from "../libs/connectEvaluationDatabase";
import {EvaluatedPosition} from "../modules/evaluatedDatabase/entity/evaluatedPosition";
import {decodeFenHash} from "../libs/fenHash";
import {Connection} from "typeorm";
import {checkEvaluation} from "../libs/checkEvaluation";


export class PositionService {

    private db: Connection;

    constructor() {
        this.initConnection();
    }

    async initConnection() {
        this.db = await evaluationConnection;
    }

    async add(fen, evaluation: IEvaluation) {

        if (checkEvaluation(fen, evaluation)) {
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
                tbhits: isNaN(Number(evaluation[LINE_MAP.tbhits])) ? 0 : Number(evaluation[LINE_MAP.tbhits]),
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
