// Task sink in node.js
// Binds PULL socket to tcp://localhost:5558
// Collects results from workers via that socket.

const zeromq = require('zeromq');
const receiver = zeromq.socket('pull');
const config = require('./config');

let started = false,
  i = 0;
const label = 'Total elapsed time';

receiver.on('message', (e) => {
  console.log('Mmessage sink ->', e.toString());
  // wait for start of batch
  if (!started) {
    console.time(label);
    started = true;

    // process 100 confirmations
  } else {
    i += 1;
    process.stdout.write(i % 10 === 0 ? ':' : '.');
    if (i === 100) {
      console.timeEnd(label);
      receiver.close();
      process.exit();
    }
  }
});

receiver.bindSync(`tcp://*:${config.worker.host2}`);
