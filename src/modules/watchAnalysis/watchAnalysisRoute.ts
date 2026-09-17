import * as Boom from "@hapi/boom";
import Joi from "joi";
import {getConfig} from "../../config";
import {SocketService} from "../../sockets/initSockets";
import {requireWatchAnalysisApiKey} from "./watchAnalysisAuth";
import {isValidAnalysisFen} from "./watchAnalysisMapper";

export function watchAnalysisRoute() {
    return [{
        method: "POST",
        path: "/watch/analyze",
        config: {
            description: "Stream a Stockfish analysis to the ChessWatch companion app",
            tags: ["api"],
            validate: {
                headers: Joi.object({
                    authorization: Joi.string().max(512).required(),
                }).unknown(true),
                payload: Joi.object({
                    requestID: Joi.string().guid().required(),
                    fen: Joi.string().max(120).required(),
                    maxVariations: Joi.number().integer().min(1).max(3).required(),
                    milliseconds: Joi.number().integer().min(100).max(10_000).required(),
                }).required(),
            },
        },
        handler: (request, h) => {
            requireWatchAnalysisApiKey(
                request.headers.authorization,
                getConfig().watchAnalysis.apiKey,
            );

            if (!isValidAnalysisFen(request.payload.fen)) {
                throw Boom.badRequest("Invalid FEN");
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
