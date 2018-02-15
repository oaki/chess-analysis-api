"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const positionService_1 = require("../services/positionService");
const interfaces_1 = require("../interfaces");
const chessJs = require('chess.js');
const pgnParser = require('pgn-parser');
class ParsePgn {
    constructor(fileContent, gamesSeparator = '[Event') {
        this.gamesSeparator = '[Event';
        this.fileContent = fileContent;
        this.gamesSeparator = gamesSeparator;
    }
    parseFileContent() {
        const games = this.fileContent.split(this.gamesSeparator);
        const output = [];
        games.forEach((game, i) => __awaiter(this, void 0, void 0, function* () {
            if (game.length > 0) {
                const pgn = `${this.gamesSeparator}${game}`.split(/[\n\r\r\t]+/g).join(' ');
                const parsedGame = yield this.parse(pgn);
                this.saveGame(parsedGame);
            }
        }));
    }
    /**
     * mappingFromParserToEvaluation
     * @param {IPosition} position
     * @returns {IEvaluation}
     *
     * nodes are approximately 1000000000 :)
     */
    mappingFromParserToEvaluation(position) {
        console.log('mappingFromParserToEvaluation', position);
        return {
            [interfaces_1.LINE_MAP.score]: position.score,
            [interfaces_1.LINE_MAP.depth]: position.depth,
            [interfaces_1.LINE_MAP.nodes]: 1000000000,
            [interfaces_1.LINE_MAP.pv]: position.pv,
            [interfaces_1.LINE_MAP.import]: 1,
        };
    }
    saveGame(parsedGame) {
        parsedGame.forEach((position) => {
            const evaluation = this.mappingFromParserToEvaluation(position);
            positionService_1.default.add(position.previousFen, evaluation);
        });
    }
    parse(pgn) {
        return __awaiter(this, void 0, void 0, function* () {
            const pgnParser = yield this.initPgnParser(pgn);
            const parsedGame = [];
            const [game] = pgnParser.parse(pgn);
            const gameResult = game.result;
            const moves = this.getMoves(game.moves);
            moves.forEach((move, index) => {
                const isWhite = move.lastMove.color === 'w' ? 1 : 0;
                if (this.checkResultAndWhoIsOnMove(isWhite, gameResult)) {
                    const pv = this.getPv(moves, index, move.depth);
                    parsedGame.push(Object.assign({}, move, { pv, import: 1 }));
                }
            });
            return parsedGame;
        });
    }
    initPgnParser(pgn) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield new Promise((resolve, err) => {
                pgnParser((err, parser) => {
                    resolve(parser);
                });
            });
        });
    }
    getMoves(moves) {
        const chess = new chessJs.Chess();
        const allMoves = [];
        moves.forEach((obj, index) => {
            const previousFen = chess.fen();
            const lastMove = chess.move(obj.move);
            const fen = chess.fen();
            const part = {
                lastMove,
                fen,
                previousFen,
            };
            if (obj.comment) {
                const info = this.getInfo(obj.comment);
                part['depth'] = info.depth;
                part['score'] = info.score;
            }
            allMoves.push(part);
        });
        return allMoves;
    }
    checkResultAndWhoIsOnMove(isWhite, gameResult) {
        if (gameResult === '1/2-1/2') {
            return true;
        }
        if (isWhite && (gameResult === '1-0')) {
            return true;
        }
        if (!isWhite && gameResult === '0-1') {
            return true;
        }
        return false;
    }
    getPv(moves, startIndex, depth) {
        let str = '';
        // startIndex + 1 - because we dont want to have a actual move but next one
        for (let i = startIndex; i < moves.length && i <= startIndex + depth; i++) {
            const lastMove = moves[i].lastMove;
            str += `${lastMove.from}${lastMove.to} `;
        }
        return str.slice(0, -1);
    }
    getInfo(comment) {
        const part1 = comment.split(' ');
        const scoreDepth = part1[0][0] === '(' ? part1[1].split('/') : part1[0].split('/');
        return {
            score: scoreDepth[0],
            depth: Number(scoreDepth[1]),
        };
    }
}
exports.ParsePgn = ParsePgn;
