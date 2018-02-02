const spawn = require('child_process').spawn;
const tools = require('./tools');

class EngineInterface {
  constructor(cmd) {
    this.cmd = cmd;
    this.child = spawn(this.cmd, []);
    this.fen = '';
    this.delay = 15000; // ms
    this.multiPv = 1;
  }

  on(handler, callback) {
    this.child.stdout.on(handler, callback);
  }

  setDelay(delay) {
    console.log('setDelay', delay);
    this.delay = delay;
  }

  setMultiPv(multiPv) {
    // console.log('setMultiPv');
    this.multiPv = multiPv;
    this.send(`setoption name multipv value ${multiPv}`);
  }

  findBestMove(fen, userId) {
    this.fen = fen;
    this.userId = userId;
    this.send(`position fen ${fen}`);
    this.send(`go movetime ${this.delay}`);
  }

  send(cmd) {
    console.log(`EngineInterface command: ${cmd}`);
    this.child.stdin.write(`${cmd}\n`);
  }

  prepare(result) {
    const obj = tools.parseResult(result);
    if (obj && obj[0]) {

      obj[0].userId = this.userId;
      obj[0].fen = this.fen;
      console.log(`ADD USER ID ${JSON.stringify(obj)}`);
    }

    return obj;
  }

  initEngine() {
    this.send('uci');
    this.send('eval');
    this.send('isready');
    this.send('ucinewgame');
    this.send('setoption name ownbook value true');
    this.setMultiPv(this.multiPv);
  }
}

module.exports = EngineInterface;
