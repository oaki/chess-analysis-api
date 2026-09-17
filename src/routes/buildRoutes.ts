import {filesRoute} from "./files";
import {positionRoute} from "./position";
import {openingBookRoute} from "../modules/openingBook/openingBookRoute";
import {evaluationDatabaseRoute} from "../modules/evaluatedDatabase/evaluationDatabaseRoute";
import {defaultRoute} from "./default";
import {historyRoute} from "../modules/user/modules/history/historyRouter";
import {authRoute} from "../modules/auth/authRoutes";
import {userRoute} from "../modules/user/userRouter";
import {workerRoute} from "../modules/user/modules/worker/workerRouter";
import {gameDatabaseRouter} from "../modules/gameDatabase/gameDatabaseRouter";
import {watchAnalysisRoute} from "../modules/watchAnalysis/watchAnalysisRoute";

function withVersion(routes: any[], version = 1): any[] {
    return routes.map(route => ({
        ...route,
        path: `/v${version}${route.path}`
    }));
}

export default function routes(server) {
    server.route(defaultRoute(server));
    server.route(filesRoute(server));

    const versionedRoutes = [
        ...authRoute(),
        ...userRoute(),
        ...positionRoute(),
        ...openingBookRoute(),
        ...evaluationDatabaseRoute(),
        ...historyRoute(),
        ...workerRoute(),
        ...gameDatabaseRouter(),
        ...watchAnalysisRoute(),
    ];
    server.route(withVersion(versionedRoutes));
}
