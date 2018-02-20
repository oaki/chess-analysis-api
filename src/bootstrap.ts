import * as Hapi from 'hapi';
import * as good from 'good';
import * as hapiSwagger from 'hapi-swagger';
import * as vision from 'vision';
import * as inert from 'inert';
import {getConfig} from './config/';
import buildRoutes from './routes/buildRoutes';
import {initSockets} from "./initSockets";
import {optionsSwagger} from "./config/swagger";
import {optionsGood} from "./config/optionsGood";
import {hapiServerOptions} from "./config/hapiServerOptions";
// import * as compression from "compression";

export async function initServer() {

    // const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -';
    // hmset(fen, 'ssss', JSON.stringify({fen}));
    //
    // const isExist = await exists(fen);
    // console.log('isExist', isExist);
    //
    // const all = await hgetall(fen);
    //
    // console.log('all keys', all);

    // const allMoves = await positionService.findAllMoves(fen);
    // console.log('allMoves', allMoves);

    // setup server Hapi
    const hapiServer = Hapi.server(hapiServerOptions);
    hapiServer.realm.modifiers.route.prefix = `/v1`; // prefix pre vsetky route

    initSockets(hapiServer);

    buildRoutes(hapiServer);

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
        }
    ]);

    await hapiServer.start();

    return hapiServer;
}
