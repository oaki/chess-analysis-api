import * as Boom from "@hapi/boom";
import Joi from "joi";
import {getConfig} from "../../config";
import {SocketService} from "../../sockets/initSockets";
import {requireWatchAnalysisApiKey} from "./watchAnalysisAuth";
import {isValidAnalysisFen, WatchAnalysisResponse} from "./watchAnalysisMapper";
import {buildMoveAdvice} from "./moveAdviceMapper";

const Chess = require("chess.js").Chess;
const MOVE_ADVICE_MILLISECONDS = 800;

async function finalAnalysis(stream: NodeJS.ReadableStream): Promise<WatchAnalysisResponse | null> {
    let buffer = "";
    let final: WatchAnalysisResponse | null = null;
    for await (const chunk of stream as any) {
        buffer += chunk.toString();
        const records = buffer.split("\n");
        buffer = records.pop() || "";
        for (const record of records) {
            if (!record) continue;
            const response = JSON.parse(record) as WatchAnalysisResponse;
            if (response.isFinal) final = response;
        }
    }
    return final;
}

export function moveAdviceRoute() {
    return [{
        method: "POST",
        path: "/watch/move-advice",
        config: {
            description: "Rank every legal move and include opening-book metadata",
            tags: ["api"],
            validate: {
                headers: Joi.object({authorization: Joi.string().max(512).optional()}).unknown(true),
                payload: Joi.object({
                    requestID: Joi.string().guid().required(),
                    fen: Joi.string().max(120).required(),
                }).required(),
            },
        },
        handler: async (request, h) => {
            requireWatchAnalysisApiKey(
                request.headers.authorization,
                getConfig().watchAnalysis.apiKey,
            );
            if (!isValidAnalysisFen(request.payload.fen)) {
                throw Boom.badRequest("Invalid FEN");
            }

            const legalMoveCount = new Chess(request.payload.fen).moves().length;
            if (legalMoveCount === 0) {
                return h.response(buildMoveAdvice(
                    request.payload.requestID,
                    request.payload.fen,
                    [],
                    [],
                )).header("Cache-Control", "private, max-age=86400");
            }

            const stream = SocketService.createWatchAnalysisStream({
                requestID: request.payload.requestID,
                fen: request.payload.fen,
                maxVariations: legalMoveCount,
                milliseconds: MOVE_ADVICE_MILLISECONDS,
            });
            if (!stream) throw Boom.serverUnavailable("No analysis worker is available");

            const {default: openingsService} = await import("../../services/openingsService");
            const [analysis, openings] = await Promise.all([
                finalAnalysis(stream),
                openingsService.find(request.payload.fen),
            ]);
            if (!analysis?.lines.length) {
                throw Boom.serverUnavailable("Move advice is unavailable");
            }

            return h.response(buildMoveAdvice(
                request.payload.requestID,
                request.payload.fen,
                analysis.lines,
                openings || [],
            )).header("Cache-Control", "private, max-age=86400");
        },
    }];
}
