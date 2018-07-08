import {models} from "../../../models/database";
import {BaseResponse} from "../../../libs/baseResponse";
import {IEvaluation, LINE_MAP} from "../../../interfaces";
import positionService from "../../../services/positionService";

const Chess = require("chess.js").Chess;
const MIN_ELO: number = 3200;

export class ParseController {
    async do(props: IDoProps) {
        const list = await models.ImportGame.findAll({
            where: {
                isParsed: false,
            },
            offset: props.offset,
            limit: props.limit,
        });


        list.forEach(async (gameInstance) => {

            const values = gameInstance.dataValues;
            console.log("Parse game ID", values.id, gameInstance.dataValues);
            const saveWhite = values.white_elo > MIN_ELO || (values.black_elo > MIN_ELO && (values.result === "1/2-1/2" || values.result === "1-0"));
            const saveBlack = values.black_elo > MIN_ELO || (values.white_elo > MIN_ELO && (values.result === "1/2-1/2" || values.result === "0-1"));
            if ((saveWhite || saveBlack) && gameInstance.dataValues.moves) {


                const chess = new Chess();

                let moves = [];
                try {
                    moves = JSON.parse(gameInstance.dataValues.moves);
                } catch (e) {
                    console.log("Error parse moves", gameInstance.dataValues.moves, e);
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


            await gameInstance.update({
                isParsed: true,
            })

        });

        return BaseResponse.getSuccess();
    }


    private map(meta: IMeta): IEvaluation {
        return {
            [LINE_MAP.depth]: Number(meta.d),
            [LINE_MAP.nodes]: meta.n,
            [LINE_MAP.pv]: meta.pv,
            [LINE_MAP.score]: meta.wv,
            [LINE_MAP.nps]: meta.s,
            [LINE_MAP.import]: 1,
        }
    }
}

interface IMeta {
    d: string;
    s: string;
    n: number;
    pv: string;
    wv: string;

}

interface IDoProps {
    offset: number;
    limit: number;
}