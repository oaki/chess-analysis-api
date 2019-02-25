import {BaseResponse} from "../../../libs/baseResponse";
import {IEvaluation, LINE_MAP} from "../../../interfaces";
import positionService from "../../../services/positionService";
import {evaluationConnection} from "../../../libs/connectEvaluationDatabase";
import {ImportedGames} from "../../evaluatedDatabase/entity/importedGames";
import {Connection} from "typeorm";

const Chess = require("chess.js").Chess;
const MIN_ELO: number = 3200;

export class ParseController {

    private db: Connection;

    constructor() {
        this.initConnection();
    }

    async initConnection() {
        this.db = await evaluationConnection;
    }

    async do(props: IDoProps) {

        const list = await this.db
            .getRepository(ImportedGames)
            .createQueryBuilder("ig")
            .where({isParsed: false})
            .limit(props.limit)
            .skip(props.offset)
            .getMany();

        console.log({list});

        const repository = await this.db.getRepository(ImportedGames);

        list.forEach(async (values) => {


            const saveWhite = values.white_elo > MIN_ELO || (values.black_elo > MIN_ELO && (values.result === "1/2-1/2" || values.result === "1-0"));
            const saveBlack = values.black_elo > MIN_ELO || (values.white_elo > MIN_ELO && (values.result === "1/2-1/2" || values.result === "0-1"));
            if ((saveWhite || saveBlack) && values.moves) {


                const chess = new Chess();

                let moves = [];
                try {
                    moves = JSON.parse(values.moves);
                } catch (e) {
                    console.log("Error parse moves", values.moves, e);
                    let moves = [];
                }

                moves.forEach(async (moveObj) => {


                    if (moveObj.meta && moveObj.meta.d) {
                        if ((chess.turn() === "w" && saveWhite)
                            || (chess.turn() === "b" && saveBlack)) {
                            const fen = chess.fen();
                            const evaluation = this.map(moveObj.meta);
                            console.log("positionService.add->fen|evaluation", fen, evaluation);
                            positionService.add(fen, evaluation);
                        } else {
                            console.log("Player doesnt have ELO", {
                                turn: chess.turn(),
                                saveWhite,
                                saveBlack,
                                white_elo: values.white_elo, black_elo: values.black_elo
                            });
                        }
                    }
                    chess.move(moveObj.move);
                });
            }

            values.isParsed = true;
            await repository.save(values);

        });


        return BaseResponse.getSuccess();
    }


    private map(meta: IMeta): IEvaluation {
        const pv = meta.pv.split(" ").slice(0, 20).join(" ").trim();
        return {
            [LINE_MAP.depth]: Number(meta.d),
            [LINE_MAP.nodes]: meta.n,
            [LINE_MAP.time]: this.convertHHmmssToSecond(meta.tl),
            [LINE_MAP.pv]: pv,
            [LINE_MAP.score]: meta.wv,
            [LINE_MAP.nps]: meta.s,
            [LINE_MAP.import]: 1,
            [LINE_MAP.mate]: false

        }
    }

    private convertHHmmssToSecond(time: string): string {
        if (!time || time.indexOf(":") === -1) {
            return String(0);
        }
        const second = time.split(":").reverse().reduce((prev: number, curr, i) => prev + Number(curr) * Math.pow(60, i), 0);

        return String(second);
    }
}

interface IMeta {
    d: string;
    s: string;
    n: number;
    pv: string;
    wv: string;
    tl: string;
}

interface IDoProps {
    offset: number;
    limit: number;
}