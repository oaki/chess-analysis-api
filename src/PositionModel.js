const getFirstMove = require('./tools').getFirstMove;
// const redisClient = require('redis-connection')(); // require & connect
const redis = require('./redisConnection');

class PositionModel {
  constructor() {
    this.client = redis.client;
    this.saveCriterium = {
      depth: 28,
      nodes: 30 * 1000000,
      maxScore: 4,
    };
  }

  getKey(evaluation) {
    return `${evaluation.depth}__${evaluation.nodes}__${getFirstMove(evaluation.pv)}`;
  }

  /** https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation
   5. remove Halfmove clock: This is the number of halfmoves since the last capture or pawn advance.
   This is used to determine if a draw can be claimed under the fifty-move rule.
   6. Fullmove number: The number of the full move. It starts at 1, and is incremented after Black's move.
   e.g.
   'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'.split(' ').splice(0, 4).join(' ');
   'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -'
   */

  normalizeFen(fen) {
    return fen.split(' ').splice(0, 4).join(' ');
  }

  checkEvaluation(evaluation) {
    if (evaluation.fen &&
      Number(evaluation.depth) > this.saveCriterium.depth &&
      Number(evaluation.nodes) > this.saveCriterium.nodes &&
      Math.abs(Number(evaluation.score)) < this.saveCriterium.maxScore &&
      evaluation.pv) {
      console.log('Interesting evaluation: ', evaluation, Number(evaluation.depth), Number(evaluation.nodes));
      return true;
    }
    return false;
  }

  add(evaluation) {
    if (this.checkEvaluation(evaluation)) {
      const key = this.getKey(evaluation);
      const evaluationWithoutUser = {...evaluation};
      delete evaluationWithoutUser.userId;
      redis.hmset(this.normalizeFen(evaluation.fen), key, JSON.stringify(evaluationWithoutUser));

      console.log('added to DB');
    } else {
      console.log('No reason to save this low analyse');
    }
  }

  findAllMoves(fen) {
    const promise = new Promise((resolve) => {

      const normalizedFen = this.normalizeFen(fen);
      redis.exists(normalizedFen).then((res) => {
        if (res !== null) {
          redis.hgetall(normalizedFen).then((arr) => {
            resolve(arr);
          });
        } else {
          resolve(null);
        }
      });
    });


    return promise;
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

module.exports = new PositionModel();
