import {Polyglot} from "./polyglot";

const polyglot = new Polyglot();

export function decodeFenHash(fen: string) {
    try {
        return polyglot.generate_hash(fen);
    } catch (e) {
        console.log("Fen is incorrect: ", fen);
        throw e;
    }
}