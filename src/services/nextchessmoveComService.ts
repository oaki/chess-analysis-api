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
        "engine": "sf10",
        "syzygy": true,
        "contempt": 24,
        "uuid": uuid
    });
    const headers = {
        "content-type": "application/json",
        Cookie: `_chess_session=NUZEejFIekEyMk9WaDRNQ1JpNUxnNDlxTzBXd21WSTR6c2hRbENSc0hWS1o2UDdRWStDZ1dEdGhCNjNwem5QVDBFL1liQk5JaGF5K0dXc2Vtb3lCY1VUaENTbGp0UFIvZXRpWHlFVUFid3FYRFdMSVYzKzR0eGF1UkFvZlR1RXE0RUJtdERUME9DeVhMdWVMb3FuNXRINmI1TW1ZejhVNW9Ha3pQNm95SWxMT05aQUR3RTJXOTVRRTFwS2UrS2kwdVVFYnlyY29VRzhXaXZhVnVic1B0OWswZ2tJbkN1NDRzMUJuWWdnS0dnVT0tLUFOTDBvTUR5NUg0OXBIdkhzajJFY0E9PQ%3D%3D--20667811743526024fe47c05f96cd73f92148017; _ncm_session=K2tvb1lSbWJBMGFLM1VEZU5sV2hmQTR5c2ZJVTEyYXM3TDV3akd4UkZuOWI3Rlo0N0kxUit1SkJJcU41dm8wL29LdGowNHlWOW9zVEowZDc1MXBLWkVQRTd6WE5KRzliY3FPMGpacXIxRjRKOFZCdnpoMUk1VEFWUjNYK09XVVdta3MxQyswNktRaFV3NWpYSXFBTXRVVmVHbTZ4NXZ5aHJ4R1lxYmpJVTliaktBMC9TL1MvcTltS1g0OE85Y3FwcE8ySWIyYWozbnNON0wrQ2VJYUs4bHArZForYmhEa2hOY1JFeUJxTjVSUT0tLVpuakU2dXpkcWlkVVlLdDZjRWZ4UlE9PQ%3D%3D--0772e56c602b887c4d5617b1af81c6812b82d61f`
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

function parseResults(json: Response, fen: string): IEvaluation {
    const lastMsg = json.log[json.log.length - 3][1];

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