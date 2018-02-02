const zmq = require('zeromq');

// Socket to send messages on
const sender = zmq.socket('push');
sender.bindSync('tcp://*:5557');

const receiver = zmq.socket('pull');
receiver.on('message', function (e) {
  console.log('get back to server e=>', e.toString());
});

receiver.bindSync('tcp://*:5558');

console.log('Sending tasks to workers…');

// The first message is "0" and signals start of batch
const position = {
  action: 'findBestMove',
  fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
};

sender.send(JSON.stringify(position));
