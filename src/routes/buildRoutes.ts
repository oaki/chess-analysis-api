import {filesRoute} from "./files";
import {positionRoute} from "./position";
import {openingBookRoute} from "./openingBook";
import {importsRoute} from "./imports";
import {defaultRoute} from "./default";

export default function routes(server) {
    server.route(defaultRoute(server));
    server.route(filesRoute(server));
    server.route(positionRoute());
    server.route(openingBookRoute());
    server.route(importsRoute());
}