import {Polyglot} from "./polyglot";
import {logger} from "./logger";

const polyglot = new Polyglot();

export function decodeFenHash(fen: string) {
    try {
        return polyglot.generate_hash(fen);
    } catch (e) {
        logger.warn({fen}, "Fen is incorrect");
        throw e;
    }
}