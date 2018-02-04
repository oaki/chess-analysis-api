const getFirstMove = require('./tools').getFirstMove;
const redisClient = require('redis-connection')(); // require & connect

class PositionModel {
  constructor() {
    this.client = redisClient;
    this.saveCriterium = {
      depth: 20,
      nodes: 20 * 1000000,
      maxScore: 4,
    };
  }

  getKey(evaluation) {
    return `${evaluation.fen}:${getFirstMove(evaluation.pv)}__${evaluation.nodes}__${evaluation.depth}`;
  }

  checkEvaluation(evaluation) {
    if (evaluation.fen &&
      Number(evaluation.depth) > this.saveCriterium.depth &&
      Number(evaluation.nodes) > this.saveCriterium.nodes &&
      Number(evaluation.score) < this.saveCriterium.maxScore &&
      evaluation.pv) {
      console.log('Interesting evaluation: ', evaluation, Number(evaluation.depth), Number(evaluation.nodes));
      return true;
    }
    return false;
  }

  add(evaluation) {
    if (this.checkEvaluation(evaluation)) {
      const key = this.getKey(evaluation);
      this.client.get(key, (err, reply) => {
        if (!reply) {
          console.log('added to redis ', JSON.stringify(evaluation));
          const evaluationWithoutUser = {...evaluation};
          delete evaluationWithoutUser.userId;
          this.client.set(key, JSON.stringify(evaluationWithoutUser));
        }
      });
    } else {
      console.log('No reason to save this low analyse');
    }
  }

  findAllMoves(fen) {
    console.log('findAllMoves', fen);
    const result = this.client.get(`${fen}?`);
    if (result) {
      console.log('result', result);
      return result;
    }
    return null;
  }
}

module.exports = new PositionModel();
