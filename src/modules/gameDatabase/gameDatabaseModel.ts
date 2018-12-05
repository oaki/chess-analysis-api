import {initPgnParser} from "../../models/ParsePgn";
import {PositionService} from "../../services/positionService";
import {countPieces} from "../../tools";

const Chess = require("chess.js").Chess;
const uniqBy = require("lodash/uniqBy");

export class GameDatabaseModel {

    private getHeaderValue(headers, name: string): string {
        if (!headers[name]) {
            throw new Error(`Field  ${name} is missing`);
        }
        return headers[name];
    }

    private getHeaders(headers: Record<string, string>) {
        return {
            white: this.getHeaderValue(headers, "White"),
            black: this.getHeaderValue(headers, "Black"),
            whiteElo: parseInt(this.getHeaderValue(headers, "WhiteElo"), 10),
            blackElo: parseInt(this.getHeaderValue(headers, "BlackElo"), 10),
            result: this.getHeaderValue(headers, "Result"),
        }
    }

    private removeMoveNumberFromFen(fen: string): string {
        return PositionService.normalizeFen(fen);
    }

    async parsePgn(pgnGame: string, uniqPositions: boolean = true, excludeEndGameNumberOfPecies: number = 7) {
        const pgnParser: any = await initPgnParser();
        const pgn = pgnGame.split(/[\n\r\r\t]+/g).join(" ").trim();

        const game = pgnParser.parse(pgn);

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
                    fen: this.removeMoveNumberFromFen(chess.fen()),
                    originalFen: chess.fen(),
                    move: moveObj.move,
                    san: isAdded.san,
                };
            });


            if (uniqPositions) {
                positions = uniqBy(positions, (item) => {
                    return item.fen;
                });
            }

            if (excludeEndGameNumberOfPecies > 2) {
                positions = positions.filter((position) => {
                    return countPieces(position.originalFen) > excludeEndGameNumberOfPecies;
                });
            }


            return {
                headers: this.getHeaders(headers),
                positions: positions,
                pgn: chess.pgn()
            }
        }

    }
}
