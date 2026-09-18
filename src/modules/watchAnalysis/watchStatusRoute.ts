import Joi from "joi";
import {getConfig} from "../../config";
import openingsService from "../../services/openingsService";
import {SocketService} from "../../sockets/initSockets";
import {requireWatchAnalysisApiKey} from "./watchAnalysisAuth";

export function watchStatusRoute() {
    return [{
        method: "GET",
        path: "/watch/status",
        config: {
            description: "Report availability of the hosted Watch analysis services",
            tags: ["api"],
            validate: {
                headers: Joi.object({authorization: Joi.string().max(512).optional()}).unknown(true),
            },
        },
        handler: (request) => {
            requireWatchAnalysisApiKey(
                request.headers.authorization,
                getConfig().watchAnalysis.apiKey,
            );
            return {
                connected: true,
                engineAvailable: SocketService.hasWatchAnalysisWorker(),
                openingBook: openingsService.status(),
            };
        },
    }];
}
