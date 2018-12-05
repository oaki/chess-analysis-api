import {filesRoute} from "./files";
import {positionRoute} from "./position";
import {openingBookRoute} from "../modules/openingBook/openingBookRoute";
import {importsRoute} from "../modules/import/importRoute";
import {defaultRoute} from "./default";
import {historyRoute} from "../modules/user/modules/history/historyRouter";
import {authRoute} from "../modules/auth/authRoutes";
import {userRoute} from "../modules/user/userRouter";
import {syncRoute} from "../modules/sync/syncRouter";
import {config, Environment} from "../config";
import {workerRoute} from "../modules/user/modules/worker/workerRouter";
import {logRoute} from "../modules/log/logRoutes";
import {gameDatabaseRouter} from "../modules/gameDatabase/gameDatabaseRouter";

export default function routes(server) {
    server.route(authRoute());
    server.route(userRoute());

    server.route(defaultRoute(server));
    server.route(filesRoute(server));
    server.route(positionRoute());
    server.route(openingBookRoute());
    server.route(importsRoute());
    server.route(historyRoute());
    server.route(workerRoute());
    server.route(logRoute());
    server.route(gameDatabaseRouter());

    console.log("config.environment", config.environment);
    if (config.environment === Environment.DEVELOPMENT) {
        server.route(syncRoute());
    }
}