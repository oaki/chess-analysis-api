import {IEvaluation, LINE_MAP} from "../interfaces";
import {pairValues} from "../tools";
import {getConfig} from "../config";

const fetchTimeout = require("fetch-timeout");

const {URLSearchParams} = require("url");

export class NextchessmoveComService {
    private host = "https://nextchessmove.com/api/v4/calculate/pro";
    private token: string = "";

    constructor(token: string) {
        this.token = token;
    }


    async fetch(fen: string) {


        const data = new URLSearchParams();

        // const data = new FormData();
        data.append("engine", "sf10");
        data.append("fen", this.prepareFen(fen));
        data.append("position[fen]", this.prepareFen(fen));
        data.append("movetime", "5");
        data.append("syzygy", "true");
        data.append("uuid", "9c49c000-cd20-4888-935f-636bc497d453");

        const options: any = {
            headers: {
                cookie: `_chess_session=${this.token}`,
                origin: "https://nextchessmove.com",
                referer: "https://nextchessmove.com/",
                "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.121 Safari/537.36",
                "x-csrf-token": "kHuQAGPDtjEnfxCiB8ubo1PO3wVsNtHgTrv/1ZZ93e4tCxMly3FbSR/n9gr/oNl3eC6UpWZflVGebG6bskYUwA==",
                "x-requested-with": "XMLHttpRequest",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            method: "POST",
            body: data
        };

        console.log({options});
// console.log({fetchTimeout});
        const response = await fetchTimeout(this.host, options, 10000, "Fetch timeout error");

        // const response = await fetch(this.host, options);

        if (response.ok) {
            const json = await response.json();
            console.log({json});
            return json;
        } else {
            console.log("Position is not found on ChessgamesComService");
            return null;
        }
    }

    async getResult(fen: string) {

        try {
            console.log("start nextchessmoveComService");
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

        console.log({lastMsg});
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

export default new NextchessmoveComService(getConfig().nextChessMoveToken);
