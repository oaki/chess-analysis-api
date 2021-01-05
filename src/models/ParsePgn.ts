import {IEvaluation, LINE_MAP} from "../interfaces";

import {getAllMatches, prepareMoves} from "../libs/utils";

const chessJs = require("chess.js");
const pgnParser = require("pgn-parser");

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
    private gamesSeparator = "[Event ";

    constructor(gamesSeparator: string = "[Event") {
        this.gamesSeparator = gamesSeparator;
    }

    async parseContent(content) {
        const games = content.split(this.gamesSeparator);
        const output: any[] = [];

        games.forEach(async (game, i) => {
            if (game.length > 0) {
                const pgn = `${this.gamesSeparator}${game}`.split(/[\n\r\r\t]+/g).join(" ");
                const parsedGame = await this.parse(pgn);
                this.saveGame(parsedGame);
            }
        });

        await new Promise(res => setTimeout(res, 2));
    };

    parseMeta(str: string) {

        // let newStr = ParsePgn.replaceAll(str, "{", "");
        // newStr = ParsePgn.replaceAll(newStr, "}", "");

        if (!str) {
            return {}
        }

        const vars = str.split(",");


        const obj: any = {};
        vars.forEach((v: string) => {
            // at first add placeholder cos I want do replace only first occurrence
            const h = v.replace("=", "__=__").split("__=__");
            const key = h[0].trim();
            obj[key] = h[1];
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
            whiteElo: "",
            blackElo: "",
            result: "",
            event: "",
            eventDate: "",
            whiteName: "",
            blackName: "",
            opening: "",
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
        let pgn = obj.content.split(/[\n\r\r\t]+/g).join(" "); // only one line
        // console.log('pgn', pgn);
        // pgn = ParsePgn.replaceAll(pgn, '\n',

        // pgn = ParsePgn.replaceAll(pgn, "}", "}\n");

        // const reg = new RegExp('([0-9\\. ]{2,5})?([a-zA-Z\\-0-8\\+\\=]{2,7}) (\\{[^\\{\\}].+\\})?');
        const matches = getAllMatches(pgn, /(([0-9]{1,3})(\. ))(([a-zA-Z]{1})([a-zA-Z\-0-8\+\=]{1,6}))( )?(\{([^}]+)\})?( )?(([a-zA-Z]{1})([a-zA-Z\-0-8\+\=]{1,6}))?( )?(\{([^}]+)\})?/gm);
        /*match: '12. Re1 {d=33, sd=33, mt=39183, tl=1027012, s=37581506, n=1472556152, pv=Re1 Re8 Bf4 Ke7 a4 a5 Be5 Rd8 h3, pvl=f1e1 h8e8 c1f4 d8e7 a2a4 a7a5 f4e5 e8d8 h2h3, tb=0, h=22.7, ph=0.0, wv=0.25, R50=48, Rd=-11, Rr=-5, mb=-1-1+1+0+0, fen=r1bk3r/pp3ppp/2p1pn2/8/8/2P2B2/P1P2PPP/R1B1R1K1 b - - 3 12,} Re8 {d=33, sd=43, pd=Re1, mt=34832, tl=1371693, s=35941280, n=1251906666, pv=Re8 Bf4 Nd5 Rad1 Bd7 Bd6 Nxc3 Rd3 Na4 Red1 Nb2 Bc7+ Kxc7 Rxd7+ Kc8 R1d4 e5 R4d6 Nc4 Rd1 Nb2 Bg4 Nxd1 Re7+ Kd8 Rd7+ Kc8 Re7+ Kd8 Rd7+ Kc8, pvl=h8e8 c1f4 f6d5 a1d1 c8d7 f4d6 d5c3 d1d3 c3a4 e1d1 a4b2 d6c7 d8c7 d3d7 c7c8 d1d4 e6e5 d4d6 b2c4 d6d1 c4b2 f3g4 b2d1 d7e7 c8d8 e7d7 d8c8 d7e7 c8d8 e7d7 d8c8, tb=0, h=54.2, ph=88.8, wv=0.00, R50=48, Rd=-10, Rr=-5, mb=-1-1+1+0+0, fen=r1bkr3/pp3ppp/2p1pn2/8/8/2P2B2/P1P2PPP/R1B1R1K1 w - - 4 13,}',
    offset: 8782,
    groups:
     [ '12. ',
       '12',
       '. ',
       'Re1',
       ' ',
       '{d=33, sd=33, mt=39183, tl=1027012, s=37581506, n=1472556152, pv=Re1 Re8 Bf4 Ke7 a4 a5 Be5 Rd8 h3, pvl=f1e1 h8e8 c1f4 d8e7 a2a4 a7a5 f4e5 e8d8 h2h3, tb=0, h=22.7, ph=0.0, wv=0.25, R50=48, Rd=-11, Rr=-5, mb=-1-1+1+0+0, fen=r1bk3r/pp3ppp/2p1pn2/8/8/2P2B2/P1P2PPP/R1B1R1K1 b - - 3 12,}',
       'd=33, sd=33, mt=39183, tl=1027012, s=37581506, n=1472556152, pv=Re1 Re8 Bf4 Ke7 a4 a5 Be5 Rd8 h3, pvl=f1e1 h8e8 c1f4 d8e7 a2a4 a7a5 f4e5 e8d8 h2h3, tb=0, h=22.7, ph=0.0, wv=0.25, R50=48, Rd=-11, Rr=-5, mb=-1-1+1+0+0, fen=r1bk3r/pp3ppp/2p1pn2/8/8/2P2B2/P1P2PPP/R1B1R1K1 b - - 3 12,',
       ' ',
       'Re8',
       ' ',
       '{d=33, sd=43, pd=Re1, mt=34832, tl=1371693, s=35941280, n=1251906666, pv=Re8 Bf4 Nd5 Rad1 Bd7 Bd6 Nxc3 Rd3 Na4 Red1 Nb2 Bc7+ Kxc7 Rxd7+ Kc8 R1d4 e5 R4d6 Nc4 Rd1 Nb2 Bg4 Nxd1 Re7+ Kd8 Rd7+ Kc8 Re7+ Kd8 Rd7+ Kc8, pvl=h8e8 c1f4 f6d5 a1d1 c8d7 f4d6 d5c3 d1d3 c3a4 e1d1 a4b2 d6c7 d8c7 d3d7 c7c8 d1d4 e6e5 d4d6 b2c4 d6d1 c4b2 f3g4 b2d1 d7e7 c8d8 e7d7 d8c8 d7e7 c8d8 e7d7 d8c8, tb=0, h=54.2, ph=88.8, wv=0.00, R50=48, Rd=-10, Rr=-5, mb=-1-1+1+0+0, fen=r1bkr3/pp3ppp/2p1pn2/8/8/2P2B2/P1P2PPP/R1B1R1K1 w - - 4 13,}',
       'd=33, sd=43, pd=Re1, mt=34832, tl=1371693, s=35941280, n=1251906666, pv=Re8 Bf4 Nd5 Rad1 Bd7 Bd6 Nxc3 Rd3 Na4 Red1 Nb2 Bc7+ Kxc7 Rxd7+ Kc8 R1d4 e5 R4d6 Nc4 Rd1 Nb2 Bg4 Nxd1 Re7+ Kd8 Rd7+ Kc8 Re7+ Kd8 Rd7+ Kc8, pvl=h8e8 c1f4 f6d5 a1d1 c8d7 f4d6 d5c3 d1d3 c3a4 e1d1 a4b2 d6c7 d8c7 d3d7 c7c8 d1d4 e6e5 d4d6 b2c4 d6d1 c4b2 f3g4 b2d1 d7e7 c8d8 e7d7 d8c8 d7e7 c8d8 e7d7 d8c8, tb=0, h=54.2, ph=88.8, wv=0.00, R50=48, Rd=-10, Rr=-5, mb=-1-1+1+0+0, fen=r1bkr3/pp3ppp/2p1pn2/8/8/2P2B2/P1P2PPP/R1B1R1K1 w - - 4 13,' ] },
 */
        // console.log('lines',lines);

        const meta = this.parseHeader(obj.header);

        let moves = [];

        for (let i = 0; i < matches.length; i++) {


            const match = matches[i]["groups"];
            console.log("match", match);
            const whiteMove = match[3];
            const whiteMeta = match[8];
            const blackMove = match[10];
            const blackMeta = match[15];

            if (whiteMove) {
                moves.push({
                    move: whiteMove,
                    meta: this.parseMeta(whiteMeta)
                });
            }

            if (whiteMove && blackMove) {
                moves.push({
                    move: blackMove,
                    meta: this.parseMeta(blackMeta)
                });
            } else {
                break;
            }

        }

        moves = prepareMoves(moves);


        console.log("parsePgnWithJson:", {meta, moves});
        // convert to default move annotation e2e4 e7e5 ... h7h8d

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
            [LINE_MAP.nodes]: position.nodes,
            [LINE_MAP.pv]: position.pv,
            [LINE_MAP.import]: 1,
            [LINE_MAP.mate]: false,
        }
    }

    private saveGame(parsedGame: IPosition[]) {
        parsedGame.forEach((position: IPosition) => {
            const evaluation = this.mappingFromParserToEvaluation(position);

            // const key = PositionService.getKey(evaluation);

            // hgetall(PositionService.normalizeFen(position.previousFen)).then((res) => {
            //     console.log("beforeSave->isExist", res);
            //     if (res === null) {
            //         positionService.add(position.previousFen, evaluation);
            //     }
            // });
        })
    }

    private async parse(pgn: string) {
        const parsedGame: IPosition[] = [];
        const [game] = pgnParser.parse(pgn);

        // console.log('Parser: -> game ->', game);
        const gameResult: IGameResult = game.result;
        const moves = this.getMoves(game.moves);
        const eloWhite = game.headers["WhiteElo"];
        const eloBlack = game.headers["BlackElo"];

        if (Number(eloWhite) < 3000 && Number(eloBlack) < 3000) {
            console.log("Elo is less than 3000");
            return [];
        }

        console.log("ELO", eloWhite, eloBlack);
        moves.forEach((move, index) => {
            const isWhite = move.lastMove.color === "w" ? 1 : 0;

            const info = {
                onMove: move.lastMove.color,
                eloWhite,
                eloBlack
            };

            console.log("info", info);

            const pv = this.getPv(moves, index, move.depth);
            parsedGame.push({...move, pv, import: 1});

        });

        return parsedGame;
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
                part["depth"] = info.depth;
                part["score"] = info.score;
            }
            allMoves.push(
                part
            )

        });

        return allMoves;
    }

    private getPv(moves: any[], startIndex: number, depth: number) {

        let str = "";
        // startIndex + 1 - because we dont want to have a actual move but next one
        for (let i = startIndex; i < moves.length && i <= startIndex + depth; i++) {
            const lastMove = moves[i].lastMove;
            str += `${lastMove.from}${lastMove.to} `;
        }

        return str.slice(0, -1);
    }

    getInfo(comment: string): IInfo {

        const part1: string[] = comment.split(" "); // (Ra3) +0.28/22 119s || +0.30/22 56s
        const scoreDepth = part1[0][0] === "(" ? part1[1].split("/") : part1[0].split("/");

        return {
            score: scoreDepth[0],
            depth: Number(scoreDepth[1]),
        };
    }

    public static replaceAll(str, searchValue, replaceValue) {
        return str.replace(new RegExp(searchValue.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"), "g"), replaceValue);
    }

}
