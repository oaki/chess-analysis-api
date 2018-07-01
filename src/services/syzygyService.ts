import fetch from "node-fetch";
import {ParsePgn} from "../models/ParsePgn";


class SyzygyService {
    private path;

    constructor(path = null) {

        if (!path) {
            this.path = 'https://tablebase.lichess.ovh/standard';
        } else {
            this.path = path;
        }
    }

    async find(fen: string): Promise<ITablebaseLichess[]> {

        const preparedFen = ParsePgn.replaceAll(fen, ' ', '_');
        console.log({preparedFen});
        const url = `${this.path}?fen=${preparedFen}`;
        try {
            const response = await fetch(url);
            if (response.ok) {
                const json = await response.json();
                return this.prepareVariants(json);
            }
        } catch (e) {
            console.log('SyzygyService->find->response', e);
            throw e;
        }
    }

    private prepareVariants(json): any {
        return json;
    }

}


export default new SyzygyService();


export interface IMove {
    uci: string;
    san: string;
    zeroing: boolean;
    checkmate: boolean;
    stalemate: boolean;
    variant_win: boolean;
    variant_loss: boolean;
    insufficient_material: boolean;
    wdl: number;
    dtz: number;
    dtm?: any;
}

export interface ITablebaseLichess {
    checkmate: boolean;
    stalemate: boolean;
    variant_win: boolean;
    variant_loss: boolean;
    insufficient_material: boolean;
    wdl: number;
    dtz: number;
    dtm?: any;
    moves: IMove[];
}



