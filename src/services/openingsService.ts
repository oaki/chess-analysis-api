import {Polyglot} from '../libs/polyglot';
import * as fs from 'fs';
import {Environment, getConfig} from "../config";

const Chess = require('chess.js').Chess;

interface OpeningResponse {
    move: string;
    weight: string;
    fen: string;
}

class OpeningService {
    private path;
    private book: any;
    private isLoaded: boolean = false;

    constructor(path = null) {

        if (!path) {
            this.path = getConfig().environment === Environment.DEVELOPMENT ? '../books/gm2001.bin' : '../books/book.bin'
        } else {
            this.path = path;
        }

        this.book = new Polyglot();
        this.init();
    }

    async init() {
        return new Promise((resolve) => {
            this.book.load_book(fs.createReadStream(`${__dirname}/${this.path}`));
            this.book.on('loaded', () => {
                console.log(`book->loaded: ${this.path}`);
                // let entries = book.find('rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq d3 0 1');
                this.isLoaded = true;
                resolve(this);
            });
        });
    }

    async find(fen: string): Promise<OpeningResponse[]> {

        if (!this.isLoaded) {
            return [];
        }


        return this.prepareVariants(this.book.find(fen), fen);
    }

    private prepareVariants(polyglotEntries: PolyglotEntry[], fen: string): OpeningResponse[] {

        if (!polyglotEntries) {
            return null;
        }
        return polyglotEntries.map((polyglotEntry: PolyglotEntry) => {
            const from = polyglotEntry.algebraic_move.substr(0, 2);
            const to = polyglotEntry.algebraic_move.substr(2, 4);

            const chessInstance = new Chess(fen);

            chessInstance.move({from, to});

            return {
                fen: chessInstance.fen(),
                move: polyglotEntry.algebraic_move,
                weight: polyglotEntry.weight,
            }
        });
    }

}


export default new OpeningService();