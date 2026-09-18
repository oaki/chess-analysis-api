import {EventEmitter} from "events";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";

vi.mock("./userSockets", () => ({default: vi.fn()}));
vi.mock("./workerSockets", () => ({workerSockets: vi.fn()}));
vi.mock("./raspberry", () => ({raspberrySocket: vi.fn()}));
vi.mock("../modules/user/modules/worker/workerController", () => ({
    WorkerController: {getWorkerRepository: vi.fn()},
}));

import {SocketService} from "./initSockets";

const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

function request(id = "d9428888-122b-4a4a-b15d-eceea8c9957a") {
    return {requestID: id, fen, maxVariations: 1, milliseconds: 100};
}

describe("SocketService watch analysis stream", () => {
    let worker: EventEmitter & {id: string; worker: {uuid: string; lastUsed: number}};

    beforeEach(() => {
        vi.useFakeTimers();
        worker = Object.assign(new EventEmitter(), {
            id: "worker-socket",
            worker: {uuid: "worker-uuid", lastUsed: 0},
        });
        (SocketService as any).workersIo = [worker];
        (SocketService as any).activeWatchAnalyses.clear();
    });

    afterEach(() => {
        (SocketService as any).workersIo = [];
        (SocketService as any).activeWatchAnalyses.clear();
        vi.useRealTimers();
    });

    it("streams a final Swift-compatible response and releases the listener", async () => {
        const commands: any[] = [];
        worker.on("setPositionToWorker", (command) => commands.push(command));

        const stream = SocketService.createWatchAnalysisStream(request());
        expect(stream).not.toBeNull();
        expect(commands).toEqual([{FEN: fen, multiPv: 1, delay: 100}]);

        let body = "";
        stream.on("data", (chunk) => body += chunk.toString());
        worker.emit("workerEvaluation", JSON.stringify([
            {fen, u: "1", d: "14", s: 0.21, m: false, p: "e2e4 e7e5"},
        ]));
        await vi.advanceTimersByTimeAsync(350);

        expect(JSON.parse(body.trim())).toEqual({
            requestID: request().requestID,
            lines: [{
                rank: 1,
                evaluation: {centipawns: {_0: 21}},
                depth: 14,
                moves: ["e4", "e5"],
                uci: "e2e4",
                wdl: undefined,
                pvUci: ["e2e4", "e7e5"],
            }],
            isFinal: true,
        });
        expect(worker.listenerCount("workerEvaluation")).toBe(0);
    });

    it("returns null without a worker", () => {
        (SocketService as any).workersIo = [];
        expect(SocketService.createWatchAnalysisStream(request())).toBeNull();
    });

    it("supersedes an active analysis on the same worker", () => {
        const stop = vi.fn();
        worker.on("stopWorker", stop);

        const first = SocketService.createWatchAnalysisStream(request("11111111-1111-4111-8111-111111111111"));
        const second = SocketService.createWatchAnalysisStream(request("22222222-2222-4222-8222-222222222222"));

        expect(first.writableEnded || first.destroyed).toBe(true);
        expect(second).not.toBeNull();
        expect(stop).toHaveBeenCalled();
        second.destroy();
    });
});
