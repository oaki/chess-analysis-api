import * as Hapi from "@hapi/hapi";
import * as hapiSwagger from "hapi-swagger";
import * as vision from "@hapi/vision";
import * as inert from "@hapi/inert";
import buildRoutes from "./routes/buildRoutes";
import {SocketService} from "./sockets/initSockets";
import {hapiServerOptions} from "./config/hapiServerOptions";
import {getConfig} from "./config/";
import {AuthenticationController} from "./controllers/authenticationController";

const config = getConfig();

export async function initServer() {
    const hapiServer = Hapi.server(hapiServerOptions);
    hapiServer.validator(require("joi"));

    await hapiServer.register({
        plugin: require("hapi-pino"),
        options: {
            logPayload: false,
            redact: ["req.headers.authorization"],
        }
    });

    await hapiServer.register({
        plugin: require("hapi-api-version"),
        options: {
            validVersions: [1],
            defaultVersion: 1,
            vendorName: "chess-analysis-api"
        }
    });

    await hapiServer.register(require("hapi-auth-jwt2"));

    hapiServer.auth.strategy("jwt", "jwt",
        {
            key: config.jwt.key,
            validate: AuthenticationController.validateJwt,
            verifyOptions: {algorithms: ["HS256"]}
        });

    SocketService.connect(hapiServer);

    buildRoutes(hapiServer);

    const optionsSwagger = {
        info: {
            title: "Chess analysis api",
            version: "2.0.1"
        },
        host: config.swagger.host,
        basePath: "/"
    };

    await hapiServer.register([
        inert,
        vision,
        {
            plugin: hapiSwagger,
            options: optionsSwagger
        },
    ]);

    await hapiServer.start();

    (hapiServer as any).logger.info({uri: hapiServer.info.uri}, "Server started");
    return hapiServer;
}
