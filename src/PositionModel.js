const getFirstMove = require('./tools').getFirstMove;
// const redisClient = require('redis-connection')(); // require & connect
const redis = require('./redisConnection');

class PositionModel {
  constructor() {
    this.client = redis.client;
    this.saveCriterium = {
      depth: 25,
      nodes: 30 * 1000000,
      maxScore: 4,
    };
  }

  getKey(evaluation) {
    return `${evaluation.depth}__${evaluation.nodes}__${getFirstMove(evaluation.pv)}`;
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
      redis.hmset(evaluation.fen, key, JSON.stringify(evaluationWithoutUser));

      console.log('added to DB');
    } else {
      console.log('No reason to save this low analyse');
    }
  }

  findAllMoves(fen) {
    const promise = new Promise((resolve) => {
      redis.exists(fen).then((res) => {
        if (res !== null) {
          redis.hgetall(fen).then((arr) => {
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
