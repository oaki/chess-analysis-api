export type EncodedMove = number;

export const PV_LENGTH = 8;
export const EMPTY_ENCODED_MOVE: EncodedMove = 0;

const FILES = "abcdefgh";
const PROMOTIONS = ["", "q", "r", "b", "n"] as const;
type PromotionPiece = typeof PROMOTIONS[number];

const UCI_MOVE_PATTERN = /^([a-h][1-8])([a-h][1-8])([qrbn])?$/;

function isPromotionPiece(value: string): value is PromotionPiece {
    return PROMOTIONS.some((promotion) => promotion === value);
}

/**
 * Only called with regex-validated squares from encodeUciMove, so file/rank
 * are always in range — no runtime guard needed here.
 */
function squareToIndex(square: string): number {
    const file = FILES.indexOf(square.charAt(0));
    const rank = Number(square.charAt(1)) - 1;

    return rank * 8 + file;
}

/**
 * Only called with a 6-bit-masked index from decodeUciMove, so it's always
 * 0-63 — no runtime guard needed here.
 */
function indexToSquare(index: number): string {
    const file = FILES.charAt(index % 8);
    const rank = Math.floor(index / 8) + 1;

    return `${file}${rank}`;
}

/**
 * Packs a UCI move into 15 bits: 6 bits from-square, 6 bits to-square, 3 bits promotion.
 */
export function encodeUciMove(uciMove: string): EncodedMove {
    const match = UCI_MOVE_PATTERN.exec(uciMove);

    if (match === null) {
        throw new Error(`Invalid UCI move: ${uciMove}`);
    }

    const [, from, to, promotion] = match;
    const promotionPiece = promotion ?? "";

    if (!isPromotionPiece(promotionPiece)) {
        throw new Error(`Invalid promotion piece: ${promotion}`);
    }

    const fromIndex = squareToIndex(from);
    const toIndex = squareToIndex(to);
    const promotionCode = PROMOTIONS.indexOf(promotionPiece);

    return (fromIndex << 9) | (toIndex << 3) | promotionCode;
}

export function decodeUciMove(encoded: EncodedMove): string {
    if (!Number.isInteger(encoded) || encoded < 0 || encoded > 0b111111111111111) {
        throw new Error(`Invalid encoded move: ${encoded}`);
    }

    const fromIndex = (encoded >> 9) & 0b111111;
    const toIndex = (encoded >> 3) & 0b111111;
    const promotionCode = encoded & 0b111;
    const promotionPiece = PROMOTIONS[promotionCode];

    if (promotionPiece === undefined) {
        throw new Error(`Invalid promotion code in encoded move: ${encoded}`);
    }

    return `${indexToSquare(fromIndex)}${indexToSquare(toIndex)}${promotionPiece}`;
}

/**
 * Encodes up to PV_LENGTH UCI moves into a fixed-length array, stopping at the
 * first move it can't parse. Shorter lines are padded with EMPTY_ENCODED_MOVE.
 */
export function encodePv(uciMoves: readonly string[]): EncodedMove[] {
    const encoded: EncodedMove[] = [];

    for (const uciMove of uciMoves.slice(0, PV_LENGTH)) {
        try {
            encoded.push(encodeUciMove(uciMove));
        } catch {
            break;
        }
    }

    while (encoded.length < PV_LENGTH) {
        encoded.push(EMPTY_ENCODED_MOVE);
    }

    return encoded;
}

export function decodePv(encoded: readonly EncodedMove[]): string[] {
    const moves: string[] = [];

    for (const move of encoded) {
        if (move === EMPTY_ENCODED_MOVE) {
            break;
        }
        moves.push(decodeUciMove(move));
    }

    return moves;
}
