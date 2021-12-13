import {IEvaluation, LINE_MAP} from "../interfaces";
import {countPieces} from "../tools";
import {evaluationConnection} from "../libs/connectEvaluationDatabase";
import {EvaluatedPosition} from "../modules/evaluatedDatabase/entity/evaluatedPosition";
import {decodeFenHash} from "../libs/fenHash";
import {checkEvaluation} from "../libs/checkEvaluation";

async function add(fen, evaluation: IEvaluation) {

    if (checkEvaluation(fen, evaluation)) {
        const db = await evaluationConnection();
        const fenHash = decodeFenHash(fen);

        const position = await db.getRepository(EvaluatedPosition)
            .createQueryBuilder("p")
            .where({fenHash})
            .orderBy("p.nodes", "DESC")
            .getOne();

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
            db.createQueryBuilder()
                .insert()
                .into(EvaluatedPosition)
                .values(values)
                .execute();
        }

    } else {
        // console.log("No reason to save this low analyse or there are less figures than 7", evaluation, "count:", countPieces(fen));
    }
}

async function findAllMoves(fen) {
    const db = await evaluationConnection();
    const fenHash = decodeFenHash(fen);
    const position = await db.getRepository(EvaluatedPosition)
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

export default {
    findAllMoves,
    add
};
