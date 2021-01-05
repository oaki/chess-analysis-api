import * as Hapi from "@hapi/hapi";
import * as good from "good";
import * as hapiSwagger from "hapi-swagger";
import * as vision from "vision";
import * as inert from "inert";
import buildRoutes from "./routes/buildRoutes";
import {SocketService} from "./sockets/initSockets";
import {optionsGood} from "./config/optionsGood";
import {hapiServerOptions} from "./config/hapiServerOptions";
import {getConfig} from "./config/";
import {AuthenticationController} from "./controllers/authenticationController";

const config = getConfig();

export async function initServer() {
    const hapiServer = Hapi.server(hapiServerOptions);
    hapiServer.validator(require("@hapi/joi"));

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
            verifyOptions: {algorithms: ["HS256"]} // pick a strong algorithm
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
        {
            plugin: good,
            options: optionsGood
        },
        inert,
        vision,
        {
            plugin: hapiSwagger,
            options: optionsSwagger
        },
    ]);


    await hapiServer.start();

    console.log(hapiServer.info.uri);
    return hapiServer;
}
