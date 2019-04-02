const cloneDeep = require("lodash/cloneDeep");
const Chess = require("chess.js").Chess;


export function generatePgn(moves: IMoveObj[]) {
    let str = `[Event "CCRL 40/4"]
[Site "CCRL"]
[Date "2017.11.08"]
[Round "399.6.15"]
[White "Houdini 6 64-bit 4CPU"]
[Black "SugaR XPrO 1.2 64-bit 4CPU"]
[Result "1-0"]
[ECO "B01"]
[Opening "Scandinavian (centre counter) defence"]
[PlyCount "108"]
[WhiteElo "3530"]
[BlackElo "3534"]

`;
    let counter = 1;
    moves.forEach((move: IMoveObj, index) => {
        if (index % 2 === 0) {
            str += `${counter}. `;
        } else {
            counter++;
        }
        str += `${move.move} `;

        if (counter % 6 === 0) {
            str += "\n";
        }
    })

    str += " 1-0";

    return str;
}

export function prepareMoves(moves: IMoveObj[]) {
    console.log("prepareMoves", moves);
    //h3 Re8 e4 c5 a3 Nc6 Bd2 Bd7 Nb5 Be6 b3 h6 Nc3 Bd7 Qc1 Kh7 Nb5 Be6 Re1 Qb8 Rb2 Bd7 Rf1 Ra6 Rb1 Rf8 Qc2 Kg8 Qd1 Kh7 Qc1
    const newChess = new Chess();

    // const pgn = generatePgn(moves);
    // console.log("pgn", newChess.pgn(), "s", pgn);
    // const isLoaded = newChess.load_pgn(pgn);


    // const movesFromChess = newChess.history();
    // console.log({isLoaded, movesFromChess});

    // const newChess = cloneDeep(chess, true);
    return moves.map((moveObj: IMoveObj) => {

        const newMoveObj = cloneDeep(moveObj);

        if (newMoveObj.meta.pv) {
            newMoveObj.meta.pv = convertSanToDefaultMoveAnnotation(newMoveObj.meta.pv, newChess.fen());
        }

        const isAdded = newChess.move(newMoveObj.move, {sloppy: true});
        if (!isAdded) {
            throw new Error(`Move is not valid: ${newMoveObj.move}`);
        }
        console.log("halllooo", "result", {isAdded, history: newChess.history()});

        // console.log("chessJs.Chess.move_from_san(moveObj.move)", newChess.move_from_san(moveObj.move));
        return newMoveObj;
    });
}

//h3 Re8 e4 c5 a3 Nc6 Bd2 Bd7 Nb5 Be6 b3 h6 Nc3 Bd7 Qc1 Kh7 Nb5 Be6 Re1 Qb8 Rb2 Bd7 Rf1 Ra6 Rb1 Rf8 Qc2 Kg8 Qd1 Kh7 Qc1
export function convertSanToDefaultMoveAnnotation(moveLine: string, fen: string) {
    if (!moveLine) {
        return moveLine;
    }

    const newChess = new Chess(fen);
    console.log("moveLine", moveLine);
    const moves: string[] = moveLine.split(" ");
    const arr: IChessJsMove[] = moves.map((move: string) => {
        const r: IChessJsMove = newChess.move(move, {sloppy: true});
        if (!r) {
            console.log("Error", {moves, fen, move});

            throw new Error(`Move does not exist: ${move}`);
        }

        return r;
    });

    let str: string = "";
    if (arr.length > 0) {

        arr.forEach((item) => {
            str += `${item.from}${item.to}`;

            if (item.promotion) {
                str += item.promotion;
            }
            str += " ";
        })
    }

    console.log("convertSanToDefaultMoveAnnotation->newLine", str);
    return str.trim();
}

export function getAllMatches(source: string, regex) {
    const matches = [];
    source.replace(regex, function () {
        matches.push({
            match: arguments[0],
            offset: arguments[arguments.length - 2],
            groups: Array.prototype.slice.call(arguments, 1, -2)
        });
        return arguments[0];
    });
    return matches;
}

interface IChessJsMove {
    from: string;
    to: string;
    promotion: string;
}

interface IMoveObj {
    move: string; //
    meta: {
        pv: string;
    };
}