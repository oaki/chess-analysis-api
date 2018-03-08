import * as prodConfig from "./prod";
import * as devConfig from "./dev";

const config = isDev() ? devConfig.config : prodConfig.config;
if (isDev()) {
    console.log('Dev');
    console.log(config);

    // const parsePgn = new ParsePgn(__dirname + '/games/test.pgn');
    // const parsePgn = new ParsePgn(__dirname + '/games/asm_fish_051117_64-bit_4cpu.pgn');
    // const fen = 'rnbqkbnr/pppp1ppp/8/4p3/8/8/PPPPPPPP/RNBQKBNR w KQkq';

    // parsePgn.parse();
}

export function getConfig() {
    return config;
}

export function getBasePath(){
    return process.cwd();
}
export function isDev() {
    return process.argv.indexOf('env=dev') !== -1;
}