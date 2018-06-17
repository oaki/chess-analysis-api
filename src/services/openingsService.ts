import {Polyglot} from '../libs/polyglot';
import * as fs from 'fs';

interface OpeningResponse {
    move: string;
    weight: string;
}

class OpeningService {
    private path;
    private book: any;
    private isLoaded: boolean = false;

    constructor(path = '../books/gm2001.bin') {
        this.path = path;
        this.book = new Polyglot();
        this.init();
    }

    async init() {
        return new Promise((resolve) => {
            this.book.load_book(fs.createReadStream(`${__dirname}/${this.path}`));
            this.book.on('loaded', () => {
                console.log('book->loaded');
                // let entries = book.find('rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq d3 0 1');
                this.isLoaded = true;
                resolve(this);
            });
        });
    }

    async find(fen: string): Promise<OpeningResponse[]> {

        if (!this.isLoaded) {
            await this.init();
        }

        return this.prepareVariants(this.book.find(fen));
    }

    private prepareVariants(polyglotEntries: PolyglotEntry[]): OpeningResponse[] {
        console.log('polyglotEntries', polyglotEntries);
        if (!polyglotEntries) {
            return null;
        }
        return polyglotEntries.map((polyglotEntry: PolyglotEntry) => {
            return {
                move: polyglotEntry.algebraic_move,
                weight: polyglotEntry.weight,
            }
        });
    }

}


export default new OpeningService();