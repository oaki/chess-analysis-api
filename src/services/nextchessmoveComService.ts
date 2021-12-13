import {IEvaluation, LINE_MAP} from "../interfaces";
import {pairValues} from "../tools";

const _findLastIndex = require("lodash/findLastIndex");

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
        console.log("Position is not found on nextChessMoveCom", response);
        return null;
    }
}

const fetchPro = async (fen: string) => {

    const uuid = "46750cb4-33d2-4154-af65-1e2cb141d46b";
    const host = "https://nextchessmove.com/api/v4/calculate/pro";

    const data = JSON.stringify({
        "kind": "remote",
        "fen": prepareFen(fen),
        "position": {
            "fen": prepareFen(fen),
            "moves": []
        },
        "movetime": 5,
        "multipv": 1,
        "hardware": {"usePaidCpu": true, "usePaidGpu": true},
        "engine": "sf12",
        "syzygy": true,
        "contempt": 24,
        "uuid": uuid
    });
    const headers = {
        "content-type": "application/json",
        Cookie: `__gads=ID=d77f260fe4745a6f-22bcec888ca600c7:T=1608155203:RT=1608155203:S=ALNI_Ma_sMZsgmmlKb7rdMMp63gEU7k5EA; _pk_id.1.e07f=0eeb7963e5dbd61f.1608155204.; _pk_ref.1.e07f=%5B%22%22%2C%22%22%2C1611745836%2C%22https%3A%2F%2Flczero.org%2F%22%5D; _ncm_session=cnRLNEpPNmM0UUlHK0NmalIxdkdhYTlGNWF2L05uS0x0bnFiQ0Rlb2hHM3c1eENaRHJlbTVpNDBYU2FGaUhwVHlmZmxDdHpGNFlMWWY2b0FKR2QvcG1LUkpBWHhiM1FVZnRlZ0RyQ1h3Z0s4aytGekxpUVRHSEF5L0ZvNTNpNkZuaHdxdHg3OXJQNmEwNDNOUWFLYUxmTHZkOXF3RkdzVFQxYU5WdUowS1pDbXExbVd1KzlYRXdRQ1Zqb2dSRHpNV3lLUkZ6dUFpYlBDWVdKU3ljVENWbTR6dmVIWk03M1ZMMHNTMm1KQ21pRT0tLS9JTWF1OEhMK1hnVG9ZOHhjdDRjRkE9PQ%3D%3D--97a9df26073d8d5792f4af85d9e03e497494cb44; __stripe_mid=debd98a4-6caf-410b-beef-d557007876c8f8e01c; __stripe_sid=fc77f667-db07-4362-9640-a8dc9a6b28e0e16bb6; user_remember_me=SFMyNTY.g2gDbQAAACC8W9mwiwegfIGaETauRKahv1wmx88Tm3H9asWHRYVarW4GAN6jhgl4AWIATxoA.P7jwVQ6HcRQ6rEVc2N9RheWkId6F00EVINBoqrO8MRU; ncm_session=SFMyNTY.g3QAAAADbQAAAAtfY3NyZl90b2tlbm0AAAAYMUFZVE5VbFh5VFFiM2c1SFp1Z09wUVZmbQAAAA5saXZlX3NvY2tldF9pZG0AAAA7dXNlcnNfc2Vzc2lvbnM6dkZ2WnNJc0hvSHlCbWhFMnJrU21vYjljSnNmUEU1dHhfV3JGaDBXRldxMD1tAAAACnVzZXJfdG9rZW5tAAAAILxb2bCLB6B8gZoRNq5EpqG_XCbHzxObcf1qxYdFhVqt.Ti3OvZhWREXvcuM-yXVhXCRAWM54ty9jDu_29OeMTz0; uvts=a8c6f64d-9cc3-46cd-4d7a-c3785696881d`
    };

    const options: RequestInit = {
        headers,
        method: "POST",
        body: data
    };

    const response = await fetchTimeout(host, options, 10000, "Fetch timeout error");

    if (response.ok) {
        const body = await response.json();
        return body;
    } else {
        console.log("Position is not found on nextChessMoveCom", response);
        return null;
    }
}

async function getResult(fen: string) {

    try {
        const response = await fetchPro(fen);
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

function parseResults(json: Response, fen: string): IEvaluation | null {
    const indexOfLastInfoMove = _findLastIndex(json.log, (row) => {
        return typeof row[1] === "string" && row[1].startsWith("info ");
    });

    const indexOfBestMove = _findLastIndex(json.log, (row) => {
        return typeof row[1] === "string" && row[1].startsWith("bestmove");
    });

    if (json.comment || indexOfLastInfoMove === -1 || indexOfBestMove === -1) {
        return null;
    }
    const lastMsg = json.log[indexOfLastInfoMove][1];

    const pv = pairValues("pv", lastMsg);
    const nodes = pairValues("nodes", lastMsg);
    const tbhits = pairValues("tbhits", lastMsg);
    const depth = pairValues("depth", lastMsg);
    const time = pairValues("time", lastMsg);
    const score = parseFloat(pairValues("cp", lastMsg)) / 100; //score

    if (typeof depth !== "string" || typeof nodes !== "string") {
        return null;
    }
    return {
        [LINE_MAP.score]: String(score),
        [LINE_MAP.depth]: Number(depth),
        [LINE_MAP.pv]: pv,
        [LINE_MAP.nodes]: Number(nodes),
        [LINE_MAP.time]: time,
        [LINE_MAP.tbhits]: tbhits,
        [LINE_MAP.mate]: false,
        [LINE_MAP.fen]: fen,
    }
}

export const NextChessMoveComService = {
    getResult
}