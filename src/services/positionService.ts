import {isDev} from "../config";
import {IEvaluation, LINE_MAP} from "../interfaces";
import {countPieces} from "../tools";
import {Connection} from "typeorm";
import {connectEvaluationDatabase} from "../libs/connectEvaluationDatabase";
import {EvaluatedPosition} from "../modules/evaluatedDatabase/entity/evaluatedPosition";

export class PositionService {

    readonly saveCriterium;
    private db: Connection;

    constructor() {
        this.saveCriterium = {
            depth: 28,
            nodes: 70 * 1000 * 1000, //27 666 454 250 e.g. 1 629 921 584
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

        connectEvaluationDatabase().then((connection) => {
            this.db = connection;
        }).catch((e) => {
            console.log("Problem with connectEvaluationDatabase", e);
        });
    }

    /** https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation
     5. remove Halfmove clock: This is the number of halfmoves since the last capture or pawn advance.
     This is used to determine if a draw can be claimed under the fifty-move rule.
     6. Fullmove number: The number of the full move. It starts at 1, and is incremented after Black's move.
     e.g.
     'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'.split(' ').splice(0, 4).join(':').split('/').join(':');
     "rnbqkbnr:pppppppp:8:8:8:8:PPPPPPPP:RNBQKBNR:w:KQkq:-"

     '8/3k4/8/8/6P1/2K5/8/8 w KQkq -'.split(' ').splice(0, 4).join(':').split('/').join(':');
     "8:3k4:8:8:6P1:2K5:8:8:w:KQkq:-"

     "8:3k4:8:8:6P1:2K5:8:8:w:KQkq:-".split(':').splice(0, 8).join('/').split(':').join(' ');
     */

    static normalizeFen(fen: string) {
        return fen.split(" ").splice(0, 4).join(":").split("/").join(":");
    }

    static denormalizeFen(normalizedFen) {
        const firstPart = normalizedFen.split(":").splice(0, 8).join("/");
        const secondPart = normalizedFen.split(":").splice(8).join(" ");

        return `${firstPart} ${secondPart}`;
    }

    static normalizePv(str: string) {
        return str;
    }

    checkEvaluation(fen, evaluation: IEvaluation) {
        const depth: number = Number(evaluation[LINE_MAP.depth]);
        const nodes = Number(evaluation[LINE_MAP.nodes]);
        const score = Math.abs(Number(evaluation[LINE_MAP.score]));
        const piecesCount = countPieces(fen);
        console.log("TEST:", {
            depth,
            nodes,
            score
        });
        if (
            piecesCount > 6
            && depth > this.saveCriterium.depth
            && (
                nodes >= this.saveCriterium.nodes
                || evaluation[LINE_MAP.import]
            )
            && score < this.saveCriterium.maxScore
            && !!evaluation[LINE_MAP.pv]
        ) {
            console.log("Interesting evaluation: ", evaluation);

            // console.log('depth',evaluation[LINE_MAP.depth], Number(evaluation[LINE_MAP.depth]) > this.saveCriterium.depth,
            //     ' Number(evaluation[LINE_MAP.nodes]) >= this.saveCriterium.nodes\n' +
            //     '                || evaluation[LINE_MAP.import]',
            //     Number(evaluation[LINE_MAP.nodes]) >= this.saveCriterium.nodes
            //     || evaluation[LINE_MAP.import],
            //     'Math.abs(Number(evaluation[LINE_MAP.score])) < this.saveCriterium.maxScore',
            //     Math.abs(Number(evaluation[LINE_MAP.score])) < this.saveCriterium.maxScore,
            //     '&& evaluation[LINE_MAP.pv]', evaluation[LINE_MAP.pv],
            //     'evaluation', evaluation,
            //     Number(evaluation[LINE_MAP.depth]), Number(evaluation[LINE_MAP.nodes])
            // );
            //
            return true;
        }
        return false;
    }

    add(fen, evaluation: IEvaluation) {

        if (this.checkEvaluation(fen, evaluation)) {
            const normalizedFen = PositionService.normalizeFen(fen);

            const values = {
                fen: normalizedFen,
                depth: Number(evaluation[LINE_MAP.depth]),
                score: Number(evaluation[LINE_MAP.score]),
                nodes: Math.round(evaluation[LINE_MAP.nodes] / 1000000),
                time: Number(evaluation[LINE_MAP.time]),
                import: !!evaluation[LINE_MAP.import] ? 1 : 0,
                tbhits: Number(evaluation[LINE_MAP.tbhits]),
                pv: evaluation[LINE_MAP.pv]
            };

            this.db.createQueryBuilder()
                .insert()
                .into(EvaluatedPosition)
                .values(values)
                .onConflict(`("fen") DO NOTHING`)
                .execute();
        } else {
            console.log("No reason to save this low analyse or there are less figures than 7", evaluation, "count:", countPieces(fen));
        }
    }

    public mapWorkerToEvaluation(workerResponse: IEvaluation): IEvaluation {
        return {
            [LINE_MAP.score]: workerResponse[LINE_MAP.score],
            [LINE_MAP.depth]: workerResponse[LINE_MAP.depth],
            [LINE_MAP.pv]: workerResponse[LINE_MAP.pv],
            [LINE_MAP.nodes]: workerResponse[LINE_MAP.nodes],
            [LINE_MAP.multipv]: workerResponse[LINE_MAP.multipv],
            [LINE_MAP.time]: workerResponse[LINE_MAP.time   ],
            [LINE_MAP.nps]: workerResponse[LINE_MAP.nps],
            [LINE_MAP.tbhits]: workerResponse[LINE_MAP.tbhits],
        }
    }

    async findAllMoves(fen) {
        const normalizedFen = PositionService.normalizeFen(fen);

        const position = await this.db.getRepository(EvaluatedPosition)
            .createQueryBuilder("p")
            .where("p.fen = :fen", {fen: normalizedFen})
            .orderBy("p.nodes", "DESC")
            .getOne();

        if (position) {
            return await position;
        }

        return null;
    }

}

export default new PositionService();
