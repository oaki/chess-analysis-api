import {IEvaluation, LINE_MAP} from "../interfaces";
import {pairValues} from "../tools";

const fetchTimeout = require("fetch-timeout");

export interface Response {
    fen: string;
    move: string;
    engine: string;
    log: string[][];
    comment?: any;
    score: string;
    saturated: boolean;
}

const fetch = async (fen: string) => {

    const uuid = "46750cb4-33d2-4154-af65-1e2cb141d46b";
    const host = "https://nextchessmove.com/api/v4/calculate";

    const data = JSON.stringify({
        "kind": "remote",
        "fen": prepareFen(fen),
        "position": {
            "fen": prepareFen(fen),
            "moves": []
        },
        "movetime": 5,
        "multipv": 1,
        "hardware": {"usePaidCpu": false, "usePaidGpu": false},
        "engine": "sf10",
        "syzygy": false,
        "contempt": 24,
        "uuid": uuid
    });
    const headers = {
        "content-type": "application/json",
    };

    const options: RequestInit = {
        headers,
        method: "POST",
        body: data
    };

    const response = await fetchTimeout(host, options, 10000, "Fetch timeout error");

    if (response.ok) {
        return await response.json();
    } else {
        console.log("Position is not found on ChessgamesComService", response);
        return null;
    }
}

async function getResult(fen: string) {

    try {
        const response = await fetch(fen);
        const results = parseResults(response, fen);
        if (results) {
            return [results];
        }
    } catch (e) {
        console.error(e);
        return null;
    }
    return null;
}

function prepareFen(fen: string) {
    //r2qk2r/1b1n1pb1/2pBp2p/pp4p1/2pPP3/2N5/PP2BPPP/R2Q1RK1 w kq a6 0 14
    //r7/4q3/8/2kp4/2pP3R/2P2BB1/1N1K4/8 b - - 0 1
    const tmp = fen.split(" ");
    const lastIndex = tmp.length - 1;
    tmp[lastIndex] = "1";
    tmp[lastIndex - 1] = "0";

    return tmp.join(" ");
}

function parseResults(json: Response, fen: string): IEvaluation {

    const lastMsg = json.log[json.log.length - 2] && json.log[json.log.length - 2][1];
    if (json.comment || !lastMsg) {
        return null;
    }

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

export const NextChessMoveComService = {
    getResult
}