import fetch from "node-fetch";
import {IEvaluation, LINE_MAP} from "../interfaces";
import {log} from "util";

const cheerio = require("cheerio");


export class ChessgamesComService {
    private host = "http://www.chessgames.com/perl/analysis";

    constructor() {

    }


    async fetch(fen: string) {
        console.log('fetch')
        //http://www.chessgames.com/perl/analysis?fen=5r1k/1p1r2qp/p2p1b2/P3p3/1Pp1Pnb1/R1Q2NP1/1BP2P2/4RBK1+b+-+-&move=30
        //1r1q1r1k/1p1bbppp/p2p4/P3p3/1Pp1Pn2/5N1P/1BPP1PP1/R2QRBK1+w+-+-&move=18.5
        const preparedFen = this.prepareFen(fen);
        const url = `${this.host}?fen=${preparedFen}`;

        const response = await fetch(url);

        if (response.ok) {
            return await response.text();
        } else {
            console.log("Position is not found on ChessgamesComService");
            return null;
        }
    }

    async getResult(fen: string): Promise<IEvaluation[]> {
        const response = await this.fetch(fen);
        const results = this.parseResults(response);
        if (results) {
            return results.map(item => {
                return {
                    [LINE_MAP.score]: item.score,
                    [LINE_MAP.depth]: item.depth,
                    [LINE_MAP.pv]: item.pv,
                    [LINE_MAP.nodes]: 0,
                    [LINE_MAP.time]: String(item.time),
                    [LINE_MAP.tbhits]: String(0),
                    [LINE_MAP.mate]: false,
                    fen: fen,
                }
            })
        }
        return null;
    }

    private prepareFen(fen: string) {
        return fen;
    }

    private parseTime(text: string) {
        const patternForTime = /([0-9\.]{0,3}) ([a-z]+) analysis by/g
        const timeMatches = this.findMatches(patternForTime, text);

        let time = 0;

        function getSecond(type: string): number {
            switch (type) {
                case "minute":
                    return 60;
                case "hour":
                    return 60 * 60;

                default:
                    return 1;
            }
        }

        if (timeMatches && timeMatches[0]) {
            const num = timeMatches[0][1];
            const type = timeMatches[0][2];
            const multiply = getSecond(type);

            time = parseFloat(num) * multiply * 1000;
        }

        return time;
    }

    private findMatches(regex, str, matches = []) {
        const res = regex.exec(str)
        res && matches.push(res) && this.findMatches(regex, str, matches)
        return matches
    }

    private parseResults(text: string) {

        const $ = cheerio.load(text);

        //before check if position is exist
        const table = $("table").first();
        const rows = table.find("td");

        //   '1) +0.26 (34 ply) 1.Nf3 e6 2.Nc3 Nc6 3.d4 cxd4 4.Nxd4 Nf6 5.Be2 d5 6.exd5 exd5 7.Bg5 Be7 8.O-O O-O 9.Bf3 h6 10.Bf4 Qb6 11.Be3 Qd8 12.h3 Bb4 13.Nce2 Ne5 14.Nf4 Bc5 15.Nd3 Bd6 16.Nxe5 Bxe5 17.c3 Re8 18.Re1 Ne4 \n\n2) +0.10 (34 ply) 1.Nc3 Nc6 2.Nf3 e6 3.d4 cxd4 4.Nxd4 Nf6 5.Be2 d5 6.exd5 exd5 7.Bg5 Bc5 8.Nb3 Be7 9.O-O O-O 10.Re1 h6 11.Bh4 Bb4 12.Bxf6 Qxf6 13.Nxd5 Qxb2 14.Nxb4 Nxb4 15.Qd2 Nc6 16.c3 Qxd2 17.Nxd2 Be6 18.Bf3 \n\n3) +0.10 (34 ply) 1.c3 Nf6 2.e5 Nd5 3.Nf3 d6 4.Bc4 dxe5 5.Nxe5 e6 6.d4 cxd4 7.Qxd4 Qb6 8.O-O Qxd4 9.cxd4 Nc6 10.Nc3 Nxc3 11.Nxc6 Nd5 12.Ne5 Bd6 13.Bb5+ Ke7 14.Bd3 f6 15.Nc4 Bc7 16.Bd2 Bd7 17.g3 Rad8 18.Be4 Bb5 19.Rfc1 Kf7 20.b3 Bc6 \n\n4) +0.08 (34 ply) 1.d4 cxd4 2.Qxd4 Nc6 3.Qd3 Nf6 4.Nc3 e6 5.Nf3 Be7 6.Be2 O-O 7.O-O Nb4 8.Qd1 d5 9.exd5 Nbxd5 10.Nxd5 Nxd5 11.c4 Nf6 12.Bf4 b6 13.Ne5 Bb7 14.Bf3 Qxd1 15.Raxd1 Bxf3 16.gxf3 Rac8 17.Kg2 Rfe8 18.Rfe1 h6 19.h3 \n\n5) +0.01 (34 ply) 1.Ne2 Nf6 2.Nbc3 Nc6 3.d4 cxd4 4.Nxd4 e5 5.Ndb5 d6 6.Nd5 Nxd5 7.exd5 Nb8 8.c4 Be7 9.Be2 O-O 10.O-O a6 11.Nc3 f5 12.b4 Nd7 13.Bd2 f4 14.a4 a5 15.Nb5 b6 16.Bg4 axb4 17.Bxb4 Nc5 18.Bxc5 bxc5 \n\n6) -0.08 (34 ply) 1.g3 d5 \n\n' }
        const str = table.text();

        const pattern = /(([0-9]\))) (([=0-9\-\+\.]){5,6}) \(([0-9]{0,3}) ply\) ([0-9\.a-zA-Z -]+)/g;
        const matches = this.findMatches(pattern, str);

        //
        const lines = matches.map(match => {
            return {
                score: match[3],
                depth: match[5],
                pv: match[6],
                time: this.parseTime(text)
            }
        });


        console.log({str, matches, lines, time: this.parseTime(text)});
        // console.log({str});

        return lines;
    }
}

export default new ChessgamesComService();
