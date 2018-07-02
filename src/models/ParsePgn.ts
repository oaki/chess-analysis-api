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
    private gamesSeparator = '[Event ';

    constructor(gamesSeparator: string = '[Event') {
        this.gamesSeparator = gamesSeparator;
    }

    async parseContent(content) {
        const games = content.split(this.gamesSeparator);
        const output: any[] = [];

        games.forEach(async (game, i) => {
            if (game.length > 0) {
                const pgn = `${this.gamesSeparator}${game}`.split(/[\n\r\r\t]+/g).join(' ');
                const parsedGame = await this.parse(pgn);
                this.saveGame(parsedGame);
            }
        });

        await new Promise(res => setTimeout(res, 2));
    };

    parseMeta(str: string) {

        let newStr = ParsePgn.replaceAll(str, '{', '');
        newStr = ParsePgn.replaceAll(newStr, '}', '');

        const vars = newStr.split(', ');


        const obj: any = {};
        vars.forEach((v) => {
            const h = v.split('=');
            const key = h[0].trim();
            obj[ key ] = h[1]
        });

        return obj;
    }

    splitHeaderAndContent(game: string) {
        const tmp = game.split(`\n\n`);

        return {
            header: tmp[0],
            content: tmp[1],
        }
    }

    parseHeader(header: string) {
        const eventMatch = header.match(/\[Event \"([a-zA-Z 0-9\.\-\,\:].*)\"\]/);
        const eventDateMatch = header.match(/\[Date \"([a-zA-Z 0-9].*)\"\]/);
        const whiteMatch = header.match(/\[White \"([a-zA-Z 0-9].*)\"\]/);
        const blackMatch = header.match(/\[Black \"([a-zA-Z 0-9].*)\"\]/);
        const openingMatch = header.match(/\[Opening \"([a-zA-Z 0-9\.\-\,\:].*)\"\]/);
        const eloWhiteMatch = header.match(/\[WhiteElo \"([0-9].*)\"/);
        const eloBlackMatch = header.match(/\[BlackElo \"([0-9].*)\"/);
        const resultMatch = header.match(/\[Result \"([0-9/-].*)\"/);
        const meta = {
            whiteElo: '',
            blackElo: '',
            result: '',
            event: '',
            eventDate: '',
            whiteName: '',
            blackName: '',
            opening: '',
        };

        if (eventMatch) {
            meta.event = eventMatch[1];
        }
        if (openingMatch) {
            meta.opening = openingMatch[1];
        }

        if (eventDateMatch) {
            meta.eventDate = eventDateMatch[1];
        }

        if (whiteMatch) {
            meta.whiteName = whiteMatch[1];
        }

        if (blackMatch) {
            meta.blackName = blackMatch[1];
        }

        if (eloWhiteMatch) {
            meta.whiteElo = eloWhiteMatch[1];
        }

        if (eloBlackMatch) {
            meta.blackElo = eloBlackMatch[1];
        }

        if (resultMatch) {
            meta.result = resultMatch[1];
        }

        return meta;
    }

    parsePgnWithJson(game: string) {
        const obj = this.splitHeaderAndContent(game);
        // console.log('tmp', obj);
        let pgn = obj.content.split(/[\n\r\r\t]+/g).join(' ');
        // console.log('pgn', pgn);
        // pgn = ParsePgn.replaceAll(pgn, '\n',

        pgn = ParsePgn.replaceAll(pgn, '}', '}\n');
        const meta = this.parseHeader(obj.header);

        const lines = pgn.split('\n');
        console.log('lines', lines);
        let startParse = false;
        let moves = [];

        // there is not json or addition data
        if (lines.length === 1) {
            const chess = new chessJs.Chess();
            const isLoaded = chess.load_pgn(game);

            if(isLoaded){
                moves = chess.history();
            }

        } else {
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                if (startParse) {
                    console.log('line', line);
                    const moveMatch = line.match(/([0-9\.]{1,3})? ?([a-zA-Z\-0-8\+ ]{2,4}) (\{[^\{\}].+\})?/);
                    // const moveMatch = line.match(/^([0-9\.]{1,3})? ?([a-zA-Z\-0-8\+ ]{2,4}) (\{[^\{\}].+\})?/);
                    console.log('moveMatch', moveMatch);

                    if (moveMatch && moveMatch[2] && moveMatch[3]) {
                        moves.push({
                            move: moveMatch[2],
                            meta: this.parseMeta(moveMatch[3])
                        })
                    }
                }

                if (line.indexOf(']') === -1) {
                    startParse = true;
                }
            }
        }


        console.log('meta', meta);
        return {moves, meta};
    }

    parseContentNew(content) {
        const games = content.split(this.gamesSeparator);

        return games;
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

        // console.log('Parser: -> game ->', game);
        const gameResult: IGameResult = game.result;
        const moves = this.getMoves(game.moves);
        const eloWhite = game.headers['WhiteElo'];
        const eloBlack = game.headers['BlackElo'];

        if (Number(eloWhite) < 3000 && Number(eloBlack) < 3000) {
            console.log('Elo is less than 3000');
            return [];
        }

        console.log('ELO', eloWhite, eloBlack);
        moves.forEach((move, index) => {
            const isWhite = move.lastMove.color === 'w' ? 1 : 0;

            const info = {
                onMove: move.lastMove.color,
                eloWhite,
                eloBlack
            };

            console.log('info', info);

            const pv = this.getPv(moves, index, move.depth);
            parsedGame.push({...move, pv, import: 1});

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

    public static replaceAll(str, searchValue, replaceValue) {
        return str.replace(new RegExp(searchValue.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&'), 'g'), replaceValue);
    }

}
