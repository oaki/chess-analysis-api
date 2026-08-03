import fetch from "node-fetch";
import {ParsePgn} from "../models/ParsePgn";
import {logger} from "../libs/logger";

class SyzygyService {
    private path: string;

    constructor(path = null) {
        this.path = path ?? "https://tablebase.lichess.ovh/standard";
    }

    async find(fen: string): Promise<ITablebaseLichess[]> {
        const preparedFen = ParsePgn.replaceAll(fen, " ", "_");
        const url = `${this.path}?fen=${preparedFen}`;
        try {
            const response = await fetch(url);
            if (response.ok) {
                return this.prepareVariants(await response.json());
            }
        } catch (e) {
            logger.warn({err: e, fen}, "syzygy lookup failed");
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
