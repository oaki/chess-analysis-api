import positionService, {PositionService} from "../services/positionService";
import {IEvaluation, IWorkerResponse, LINE_MAP} from "../interfaces";
import {number} from "joi";
import {exists, hgetall, hmset} from "../services/redisConnectionService";

const chessJs = require('chess.js');
const pgnParser = require('pgn-parser');

export interface IPosition {
    pv: string;
    fen: string;
    previousFen: string;
    depth: number;
    nodes?: number;
    score: string;
    import: number;
}

interface IInfo {
    depth: number;
    score: string;
}

interface IGameMove {
    move: string;
}

interface IGameResult {
    moves: IGameMove[];
}

export class ParsePgn {
    private content: string;
    private gamesSeparator = '[Event';
    private beforeSaveCondition;

    constructor(content: string, beforeSaveCondition: (args: any) => boolean, gamesSeparator: string = '[Event') {
        this.content = content;
        this.gamesSeparator = gamesSeparator;
        this.beforeSaveCondition = beforeSaveCondition;
    }

    async parseContent() {
        const games = this.content.split(this.gamesSeparator);
        const output: any[] = [];

        games.forEach(async (game, i) => {
            if (game.length > 0) {
                const pgn = `${this.gamesSeparator}${game}`.split(/[\n\r\r\t]+/g).join(' ');
                const parsedGame = await this.parse(pgn);
                this.saveGame(parsedGame);
            }
        });

        await new Promise(res => setTimeout(res, 100));
    };


    /**
     * mappingFromParserToEvaluation
     * @param {IPosition} position
     * @returns {IEvaluation}
     *
     * nodes are approximately 1000000000 :)
     */
    private mappingFromParserToEvaluation(position: IPosition): IEvaluation {

        return {
            [LINE_MAP.score]: position.score,
            [LINE_MAP.depth]: position.depth,
            [LINE_MAP.nodes]: 1000000000,
            [LINE_MAP.pv]: position.pv,
            [LINE_MAP.import]: 1,
        }
    }

    private saveGame(parsedGame: IPosition[]) {
        parsedGame.forEach((position: IPosition) => {
            const evaluation = this.mappingFromParserToEvaluation(position);

            // const key = PositionService.getKey(evaluation);

            hgetall(PositionService.normalizeFen(position.previousFen)).then((res) => {
                console.log('beforeSave->isExist', res);
                if (res === null) {
                    positionService.add(position.previousFen, evaluation);
                }
            });
        })
    }

    private async parse(pgn: string) {
        const pgnParser: any = await this.initPgnParser(pgn);
        const parsedGame: IPosition[] = [];
        const [game] = pgnParser.parse(pgn);

        console.log('Parser: -> game ->', game);
        const gameResult: IGameResult = game.result;
        const moves = this.getMoves(game.moves);
        const eloWhite = game.headers['WhiteElo'];
        const eloBlack = game.headers['BlackElo'];

        console.log('ELO', eloWhite, eloBlack);
        moves.forEach((move, index) => {
            const isWhite = move.lastMove.color === 'w' ? 1 : 0;

            const info = {
                onMove: move.lastMove.color,
                eloWhite,
                eloBlack
            };

            console.log('info', info);

            if (this.beforeSaveCondition(info) && this.checkResultAndWhoIsOnMove(isWhite, gameResult)) {
                const pv = this.getPv(moves, index, move.depth);
                parsedGame.push({...move, pv, import: 1});
            }
        });

        return parsedGame;
    }

    private async initPgnParser(pgn: string) {
        return await
            new Promise((resolve, err) => {
                pgnParser((err, parser) => {
                    resolve(parser);
                });
            });
    }


    private getMoves(moves) {
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
                const info: IInfo = this.getInfo(obj.comment);
                part['depth'] = info.depth;
                part['score'] = info.score;
            }
            allMoves.push(
                part
            )

        });

        return allMoves;
    }

    private checkResultAndWhoIsOnMove(isWhite, gameResult) {

        return true; // save all imported moves
        /*if (gameResult === '1/2-1/2') {
            return true;
        }

        if (isWhite && (gameResult === '1-0')) {
            return true;
        }

        if (!isWhite && gameResult === '0-1') {
            return true;
        }

        return false;*/
    }


    private getPv(moves: any[], startIndex: number, depth: number) {

        let str = '';
        // startIndex + 1 - because we dont want to have a actual move but next one
        for (let i = startIndex; i < moves.length && i <= startIndex + depth; i++) {
            const lastMove = moves[i].lastMove;
            str += `${lastMove.from}${lastMove.to} `;
        }

        return str.slice(0, -1);
    }

    getInfo(comment: string): IInfo {

        const part1: string[] = comment.split(' '); // (Ra3) +0.28/22 119s || +0.30/22 56s
        const scoreDepth = part1[0][0] === '(' ? part1[1].split('/') : part1[0].split('/');

        return {
            score: scoreDepth[0],
            depth: Number(scoreDepth[1]),
        };
    }

}
