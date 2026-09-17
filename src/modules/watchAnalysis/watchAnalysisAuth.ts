import {createHash, timingSafeEqual} from "crypto";
import * as Boom from "@hapi/boom";

function digest(value: string): Buffer {
    return createHash("sha256").update(value, "utf8").digest();
}

export function requireWatchAnalysisApiKey(
    authorizationHeader: string | undefined,
    configuredApiKey: string,
): void {
    if (!configuredApiKey) {
        throw Boom.serverUnavailable("Watch analysis authentication is not configured");
    }

    const match = /^Bearer ([^\s]+)$/.exec(authorizationHeader || "");
    if (!match || !timingSafeEqual(digest(match[1]), digest(configuredApiKey))) {
        throw Boom.unauthorized("Invalid analysis credentials");
    }
}
