import {countPieces} from "../../tools";
import {decodeFenHash} from "../../libs/fenHash";

const Chess = require("chess.js").Chess;
const uniqBy = require("lodash/uniqBy");
const pgnParser = require("pgn-parser");

type PgnHeaders = PgnHeader[];
type PgnHeader = { name: string; value: string };

export class GameDatabaseModel {

    private getHeaderValue(headers: PgnHeaders, name: string, defaultValue?: string): string {
        const header = headers.find(item => item.name == name);
        if (!header) {
            if(defaultValue){
                return defaultValue;
            }
            throw new Error(`Field  ${name} is missing`);
        }
        return header.value;
    }

    private getHeaders(headers: PgnHeaders) {
        return {
            white: this.getHeaderValue(headers, "White"),
            black: this.getHeaderValue(headers, "Black"),
            whiteElo: parseInt(this.getHeaderValue(headers, "WhiteElo", '0'), 10),
            blackElo: parseInt(this.getHeaderValue(headers, "BlackElo", '0'), 10),
            result: this.getHeaderValue(headers, "Result"),
        }
    }

    static preparePgn(pgnGame: string): string {
        let pgn = pgnGame.split(/[\n\r\r\t]+/g).join(" ").trim();
        const pattern = new RegExp(/\(\{[a-zA-Z ]+\}/, "g");
        pgn = pgn.replace(pattern, "(");

        return pgn;
    }

    async parsePgn(pgnGame: string, uniqPositions: boolean = true, excludeEndGameNumberOfPieces: number = 7) {

        const preparedPgn = GameDatabaseModel.preparePgn(pgnGame);
        const game = pgnParser.parse(preparedPgn);
        console.log("parsed pgn", game);
        debugger;

        console.log("gamegamegamegamegamegamegame", game[0]["headers"]);
        if (game.length > 0) {
            const headers = game[0].headers;
            const moves = game[0].moves;

            const chess = new Chess();
            let positions = moves.map((moveObj: any) => {
                const isAdded = chess.move(moveObj.move, {sloppy: true});

                if (!isAdded) {
                    throw new Error(`Move is not valid: ${moveObj.move}`);
                }

                return {
                    fenHash: decodeFenHash(chess.fen()),
                    originalFen: chess.fen(),
                    move: moveObj.move,
                    san: isAdded.san,
                };
            });


            if (uniqPositions) {
                positions = uniqBy(positions, (item) => {
                    return item.fenHash;
                });
            }

            if (excludeEndGameNumberOfPieces > 2) {
                positions = positions.filter((position) => {
                    return countPieces(position.originalFen) > excludeEndGameNumberOfPieces;
                });
            }


            return {
                headers: this.getHeaders(headers),
                positions: positions,
                pgn: chess.pgn(),
                originalPgn: pgnGame,
            }
        }

    }
}
