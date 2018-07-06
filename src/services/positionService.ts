import {isDev} from "../config";
import {IEvaluation, LINE_MAP} from "../interfaces";
import {getFirstMove} from "../tools";
import {exists, hgetall, hmset} from './redisConnectionService';

export class PositionService {

    private saveCriterium;

    constructor() {
        this.saveCriterium = {
            depth: 28,
            nodes: 70 * 1000000, //27 666 454 250 - 70 000 000 / 659 843 416
            maxScore: 3.5,
        };

        console.log('isDev()', isDev());
        if (isDev()) {

            this.saveCriterium = {
                depth: 10,
                nodes: 10 * 100000,
                maxScore: 3.5,
            };

            console.log('saveCriterium', this.saveCriterium);
        }
    }


    static getKey(evaluation: IEvaluation) {
        const nodes = Math.round(evaluation[LINE_MAP.nodes] / 1000);
        return `${evaluation[LINE_MAP.depth]}:${nodes}:${getFirstMove(evaluation[LINE_MAP.pv])}`;
    }

    /** https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation
     5. remove Halfmove clock: This is the number of halfmoves since the last capture or pawn advance.
     This is used to determine if a draw can be claimed under the fifty-move rule.
     6. Fullmove number: The number of the full move. It starts at 1, and is incremented after Black's move.
     e.g.
     'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'.split(' ').splice(0, 4).join(':').split('/').join(':');
     "rnbqkbnr:pppppppp:8:8:8:8:PPPPPPPP:RNBQKBNR:w:KQkq:-"

     '8/3k4/8/8/6P1/2K5/8/8 w KQkq -'.split(' ').splice(0, 4).join(':').split('/').join(':');
     "8:3k4:8:8:6P1:2K5:8:8:w:KQkq:-"

     "8:3k4:8:8:6P1:2K5:8:8:w:KQkq:-".split(':').splice(0, 8).join('/').split(':').join(' ');
     */

    static normalizeFen(fen: string) {
        return fen.split(' ').splice(0, 4).join(':').split('/').join(':');
    }

    static denormalizeFen(normalizedFen) {
        const firstPart = normalizedFen.split(':').splice(0, 8).join('/');
        const secondPart = normalizedFen.split(':').splice(8).join(' ');

        return `${firstPart} ${secondPart}`;
    }

    static normalizePv(str: string) {
        return str;
    }

    public static beforeSaveEvaluation(evaluation: IEvaluation): IEvaluation {
        const toSave: IEvaluation = {...evaluation};

        toSave[LINE_MAP.nodes] = Math.round(toSave[LINE_MAP.nodes] / 1000);
        // toSave[LINE_MAP.mate] = toSave[LINE_MAP.mate] ? 1 : 0;
        // toSave[LINE_MAP.pv] = toSave[LINE_MAP.pv].split(' ').join('');

        return toSave;
    }

    checkEvaluation(evaluation: IEvaluation) {
        const depth: number = Number(evaluation[LINE_MAP.depth]);

        if (depth > this.saveCriterium.depth
            && (
                Number(evaluation[LINE_MAP.nodes]) >= this.saveCriterium.nodes
                || evaluation[LINE_MAP.import]
            )
            && Math.abs(Number(evaluation[LINE_MAP.score])) < this.saveCriterium.maxScore
            && evaluation[LINE_MAP.pv]
        ) {
            console.log('Interesting evaluation: ', evaluation);

            // console.log('depth',evaluation[LINE_MAP.depth], Number(evaluation[LINE_MAP.depth]) > this.saveCriterium.depth,
            //     ' Number(evaluation[LINE_MAP.nodes]) >= this.saveCriterium.nodes\n' +
            //     '                || evaluation[LINE_MAP.import]',
            //     Number(evaluation[LINE_MAP.nodes]) >= this.saveCriterium.nodes
            //     || evaluation[LINE_MAP.import],
            //     'Math.abs(Number(evaluation[LINE_MAP.score])) < this.saveCriterium.maxScore',
            //     Math.abs(Number(evaluation[LINE_MAP.score])) < this.saveCriterium.maxScore,
            //     '&& evaluation[LINE_MAP.pv]', evaluation[LINE_MAP.pv],
            //     'evaluation', evaluation,
            //     Number(evaluation[LINE_MAP.depth]), Number(evaluation[LINE_MAP.nodes])
            // );
            //
            return true;
        }
        return false;
    }

    add(fen, evaluation: IEvaluation) {

        if (this.checkEvaluation(evaluation)) {
            const key = PositionService.getKey(evaluation);
            const json = JSON.stringify(PositionService.beforeSaveEvaluation(evaluation));

            hmset(PositionService.normalizeFen(fen), key, json);

            console.log('added to Redis', fen, json);
        } else {

            console.log('No reason to save this low analyse', evaluation);
        }
    }

    public mapWorkerToEvaluation(workerResponse: IEvaluation): IEvaluation {
        return {
            [LINE_MAP.score]: workerResponse[LINE_MAP.score],
            [LINE_MAP.depth]: workerResponse[LINE_MAP.depth],
            [LINE_MAP.pv]: workerResponse[LINE_MAP.pv],
            [LINE_MAP.nodes]: workerResponse[LINE_MAP.nodes],
            [LINE_MAP.multipv]: workerResponse[LINE_MAP.multipv],
            [LINE_MAP.time]: workerResponse[LINE_MAP.time],
            [LINE_MAP.nps]: workerResponse[LINE_MAP.nps],
            [LINE_MAP.tbhits]: workerResponse[LINE_MAP.tbhits],
        }
    }

    async findAllMoves(fen) {
        const normalizedFen = PositionService.normalizeFen(fen);
        const isExist = await exists(normalizedFen);
        console.log('findAllMoves->isExist', isExist);
        if (isExist !== null) {
            return await hgetall(normalizedFen);
        }

        return null;
    }

    getBestVariant(variants) {

        // ordering by depth and nodes, best first
        const keys = Object.keys(variants);
        keys.sort((key1, key2) => {
            if (key1 < key2) return 1;
            if (key1 > key2) return -1;

            return 0;
        });

        return variants[keys[0]];
    }
}

export default new PositionService();
