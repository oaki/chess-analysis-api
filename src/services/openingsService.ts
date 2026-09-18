import {Polyglot, polyglotHash} from "../libs/polyglot";
import * as fs from "fs";
import * as path from "path";
import {decode_move} from "../libs/polyglot/encoding";
import {Environment, getConfig} from "../config";
import {logger} from "../libs/logger";

const Chess = require("chess.js").Chess;

export interface OpeningResponse {
    move: string;
    weight: string;
    fen: string;
    san: string;
}

class OpeningService {
    private path;
    private book: any;
    private isLoaded: boolean = false;
    private fileDescriptor: number | null = null;
    private recordCount = 0;
    private bookName = "Built-in opening book";

    constructor(path = null) {

        const diskBookPath = path || process.env.OPENING_BOOK_PATH;
        if (diskBookPath) {
            this.path = diskBookPath;
            this.bookName = require("path").basename(diskBookPath);
            this.openDiskBook();
            return;
        }

        if (!path) {
            this.path = getConfig().environment === Environment.DEVELOPMENT ? "../books/gm2001.bin" : "../books/book.bin"
        } else {
            this.path = path;
        }

        this.book = new Polyglot();
        this.init();
    }

    private openDiskBook() {
        const resolved = path.resolve(this.path);
        const size = fs.statSync(resolved).size;
        if (size % 16 !== 0) {
            throw new Error(`Invalid Polyglot opening book size: ${size}`);
        }
        this.fileDescriptor = fs.openSync(resolved, "r");
        this.recordCount = size / 16;
        this.isLoaded = true;
        logger.info({path: resolved, records: this.recordCount}, "disk opening book ready");
    }

    async init() {
        return new Promise((resolve) => {
            this.book.load_book(fs.createReadStream(`${__dirname}/${this.path}`));
            this.book.on("loaded", () => {
                logger.info({path: this.path}, "opening book loaded");
                this.isLoaded = true;
                resolve(this);
            });
        });
    }

    async find(fen: string): Promise<OpeningResponse[]> {

        if (!this.isLoaded) {
            return [];
        }


        const entries = this.fileDescriptor === null
            ? this.book.find(fen)
            : this.findOnDisk(polyglotHash(fen));
        return this.prepareVariants(entries, fen);
    }

    status() {
        return {loaded: this.isLoaded, name: this.bookName, records: this.recordCount || undefined};
    }

    private findOnDisk(hash: string): PolyglotEntry[] {
        const target = BigInt(`0x${hash}`);
        let low = 0;
        let high = this.recordCount;
        const record = Buffer.allocUnsafe(16);
        while (low < high) {
            const middle = Math.floor((low + high) / 2);
            fs.readSync(this.fileDescriptor, record, 0, 16, middle * 16);
            if (record.readBigUInt64BE(0) < target) low = middle + 1;
            else high = middle;
        }

        const matches: PolyglotEntry[] = [];
        for (let index = low; index < this.recordCount; index += 1) {
            fs.readSync(this.fileDescriptor, record, 0, 16, index * 16);
            if (record.readBigUInt64BE(0) !== target) break;
            matches.push({
                algebraic_move: decode_move(record.readUInt16BE(8)),
                weight: String(record.readUInt16BE(10)),
            } as PolyglotEntry);
        }
        return matches;
    }

    private prepareVariants(polyglotEntries: PolyglotEntry[], fen: string): OpeningResponse[] {

        if (!polyglotEntries) {
            return null;
        }
        return polyglotEntries.map((polyglotEntry: PolyglotEntry) => {
            const from = polyglotEntry.algebraic_move.substr(0, 2);
            const to = polyglotEntry.algebraic_move.substr(2, 4);

            const chessInstance = new Chess(fen);

            const move = chessInstance.move({from, to});

            return {
                fen: chessInstance.fen(),
                move: polyglotEntry.algebraic_move,
                weight: polyglotEntry.weight,
                san: move.san
            }
        });
    }

}


export default new OpeningService();
