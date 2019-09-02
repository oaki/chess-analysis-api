import {IEvaluation, LINE_MAP} from "../interfaces";
import {pairValues} from "../tools";
import {getConfig} from "../config";

const fetchTimeout = require("fetch-timeout");

const {URLSearchParams} = require("url");

export class NextchessmoveComService {

    private token: string = "";

    constructor(token: string) {
        this.token = token;
    }


    async fetch(fen: string) {


        // const data = new URLSearchParams();
        const host = "https://nextchessmove.com/api/v4/calculate/pro";
        const data = JSON.stringify({
            "kind": "remote",
            "fen": this.prepareFen(fen),
            "position": {
                "fen": this.prepareFen(fen),
                "moves": []
            },
            "movetime": 5,
            "multipv": 1,
            "hardware": {"usePaidCpu": true, "usePaidGpu": true},
            "engine": "sf10",
            "syzygy": true,
            "uuid": "84a84117-e9e4-4381-a1b0-b6bd026bd9dd"
        });

        const headers = {
            "sec-fetch-mode": "cors",
            "origin": "https://nextchessmove.com",
            "accept-encoding": "gzip, deflate, br",
            "x-csrf-token": "lSYzug1bPYYIUStebFFJqvTissF9Cxm0tB8A533z1aSVQ5EFlWygR9CYIVFmNJPMAFBUXm1EWJn5e8CWtQwlYw==",
            "accept-language": "en-US,en;q=0.9,sk;q=0.8",
            "cookie": this.token,
            "pragma": "no-cache",
            "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36",
            "content-type": "application/json",
            "accept": "*/*",
            "cache-control": "no-cache,no-cache",
            "authority": "nextchessmove.com",
            "referer": "https://nextchessmove.com/",
            "sec-fetch-site": "same-origin",
            "Postman-Token": "412d64e5-5367-4523-8c9f-7a80bf3c5356,8abe77cc-d888-4ce2-abe7-8b44376e854e",
            "Host": "nextchessmove.com",
            "content-length": "328",
            "Connection": "keep-alive"
        }
        const options: RequestInit = {
            headers,
            method: "POST",
            body: data
        };

        console.log({options});
// console.log({fetchTimeout});
        const response = await fetchTimeout(host, options, 10000, "Fetch timeout error");

        if (response.ok) {
            const json = await response.json();
            // console.log({json});
            return json;
        } else {
            console.log("Position is not found on ChessgamesComService", response);
            return null;
        }
    }

    async getResult(fen: string) {

        try {
            const response = await this.fetch(fen);
            const results = this.parseResults(response, fen);
            if (results) {
                return [results];
            }
        } catch (e) {
            console.error(e);
            return null;
        }
        return null;
    }

    private prepareFen(fen: string) {
        //r2qk2r/1b1n1pb1/2pBp2p/pp4p1/2pPP3/2N5/PP2BPPP/R2Q1RK1 w kq a6 0 14
        //r7/4q3/8/2kp4/2pP3R/2P2BB1/1N1K4/8 b - - 0 1
        const tmp = fen.split(" ");
        const lastIndex = tmp.length - 1;
        tmp[lastIndex] = "1";
        tmp[lastIndex - 1] = "0";

        return tmp.join(" ");
    }

    private parseResults(json: Response, fen: string): IEvaluation {

        const lastMsg = json.log[json.log.length - 2] && json.log[json.log.length - 2][1];
        if (json.comment || !lastMsg) {
            return null;
        }

//lineStr-> info depth 20 seldepth 33 multipv 1 score cp 18 nodes 21990437 nps 2198603 hashfull 319 tbhits 0 time 10002 pv d7d5 d2d4
        const pv = pairValues("pv", lastMsg);
        const nodes = pairValues("nodes", lastMsg);
        const tbhits = pairValues("tbhits", lastMsg);
        const depth = pairValues("depth", lastMsg);
        const time = pairValues("time", lastMsg);
        const score = parseFloat(pairValues("cp", lastMsg)) / 100; //score

        return {
            [LINE_MAP.score]: String(score),
            [LINE_MAP.depth]: depth,
            [LINE_MAP.pv]: pv,
            [LINE_MAP.nodes]: nodes,
            [LINE_MAP.time]: time,
            [LINE_MAP.tbhits]: tbhits,
            [LINE_MAP.mate]: false,
            [LINE_MAP.fen]: fen,
        }
    }
}

export interface Response {
    fen: string;
    move: string;
    engine: string;
    log: string[][];
    comment?: any;
    score: string;
    saturated: boolean;
}

export default new NextchessmoveComService(getConfig().nextChessMoveCookie);
