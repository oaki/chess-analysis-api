import * as Boom from "@hapi/boom";
import Joi from "joi";
import {getConfig} from "../../config";
import {SocketService} from "../../sockets/initSockets";
import {requireWatchAnalysisApiKey} from "./watchAnalysisAuth";
import {isValidAnalysisFen, mapWorkerEvaluation} from "./watchAnalysisMapper";
import positionService from "../../services/positionService";

export function watchAnalysisRoute() {
    return [{
        method: "POST",
        path: "/watch/analyze",
        config: {
            description: "Stream a Stockfish analysis to the ChessWatch companion app",
            tags: ["api"],
            validate: {
                headers: Joi.object({
                    authorization: Joi.string().max(512).optional(),
                }).unknown(true),
                payload: Joi.object({
                    requestID: Joi.string().guid().required(),
                    fen: Joi.string().max(120).required(),
                    maxVariations: Joi.number().integer().min(1).max(3).required(),
                    milliseconds: Joi.number().integer().min(100).max(120_000).required(),
                    forceRecompute: Joi.boolean().optional().default(false),
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

            if (!request.payload.forceRecompute) {
                try {
                    const cached = await positionService.findCompleteAnalysis(request.payload.fen);
                    if (cached) {
                        const lines = mapWorkerEvaluation(
                            JSON.stringify([cached]),
                            request.payload.fen,
                            request.payload.maxVariations,
                        ) || [];
                        if (lines.length > 0) {
                            return h.response(`${JSON.stringify({
                                requestID: request.payload.requestID,
                                lines,
                                isFinal: true,
                                cached: true,
                            })}\n`)
                                .type("application/x-ndjson; charset=utf-8")
                                .header("Cache-Control", "private, max-age=86400")
                                .header("X-Analysis-Cache", "HIT");
                        }
                    }
                } catch (_) {
                    // A database outage must never prevent live engine analysis.
                }
            }

            const stream = SocketService.createWatchAnalysisStream(request.payload);
            if (!stream) {
                throw Boom.serverUnavailable("No analysis worker is available");
            }

            return h.response(stream)
                .type("application/x-ndjson; charset=utf-8")
                .header("Cache-Control", "no-store")
                .header("X-Accel-Buffering", "no");
        },
    }];
}
