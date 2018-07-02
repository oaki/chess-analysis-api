import {models} from "../../../models/database";
import {BaseResponse} from "../../../libs/baseResponse";
import {IEvaluation, LINE_MAP} from "../../../interfaces";
import positionService from "../../../services/positionService";

const Chess = require("chess.js").Chess;

export class ParseController {
    async do(props: IDoProps) {
        const list = await models.ImportGame.findAll({
            where: {
                isParsed: false
            },
            offset: props.offset,
            limit: props.limit,
            raw: true
        });


        list.forEach((item) => {
            const chess = new Chess();

            const moves = JSON.parse(item.moves);
            moves.forEach((moveObj) => {
                chess.move(moveObj.move);

                if (moveObj.meta && moveObj.meta.d) {
                    const fen = chess.fen();
                    const evaluation = this.map(moveObj.meta);
                    console.log("positionService.add->fen|evaluation", fen, evaluation);
                    positionService.add(fen, evaluation);
                }

            });
            console.log("item", moves);
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