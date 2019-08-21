import {filesRoute} from "./files";
import {positionRoute} from "./position";
import {openingBookRoute} from "../modules/openingBook/openingBookRoute";
import {evaluationDatabaseRoute} from "../modules/evaluatedDatabase/evaluationDatabaseRoute";
import {defaultRoute} from "./default";
import {historyRoute} from "../modules/user/modules/history/historyRouter";
import {authRoute} from "../modules/auth/authRoutes";
import {userRoute} from "../modules/user/userRouter";
import {config} from "../config";
import {workerRoute} from "../modules/user/modules/worker/workerRouter";
import {gameDatabaseRouter} from "../modules/gameDatabase/gameDatabaseRouter";

export default function routes(server) {
    server.route(authRoute());
    server.route(userRoute());

    server.route(defaultRoute(server));
    server.route(filesRoute(server));
    server.route(positionRoute());
    server.route(openingBookRoute());
    server.route(evaluationDatabaseRoute());
    server.route(historyRoute());
    server.route(workerRoute());
    server.route(gameDatabaseRouter());

    console.log("config.environment", config.environment);

}