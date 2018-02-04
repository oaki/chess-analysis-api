const app = require('express')();
const https = require('https');
const fs = require('fs');
const positionModel = require('./PositionModel.js');
const zeromq = require('zeromq');

const isDev = process.argv.indexOf('env=dev') !== -1;
const config = isDev ? require('./config/dev') : require('./config/prod');

if (isDev) {
  console.log('Dev');
  console.log(config);
}
// Socket to send messages on
const sender = zeromq.socket('push');
sender.bindSync(`tcp://*:${config.worker.host1}`);

const receiver = zeromq.socket('pull');
receiver.bindSync(`tcp://*:${config.worker.host2}`);

const httpsOptions = {
  key: fs.readFileSync(`${__dirname}/key.pem`),
  cert: fs.readFileSync(`${__dirname}/cert.pem`),
};

const server = https.createServer(httpsOptions, app);

server.listen(config.server.port, () => {
  console.log(`Server running at port: ${config.server.port}`);
});

app.get('/', (req, res) => {
  res.sendFile(`${__dirname}/public/index.html`);
});

const sockets = {};

receiver.on('message', (data) => {
  const json = JSON.parse(data.toString());

  if (json && json[0]) {
    const d = json[0];

    console.log('4. Server: message->', JSON.stringify(d));
    if (sockets[d.userId]) {
      const socket = sockets[d.userId];
      positionModel.add(d);
      socket.emit('on_result', {
        fen: d.fen, data: d,
      });
    }
  }
});

const io = require('socket.io')(server);

// async function foo(fen, position) {
//   const evaluation = await positionModel.findAllMoves(fen);
//   console.log('evaluation:', evaluation);
//   if (!evaluation) {
//     sender.send(JSON.stringify(position));
//   } else {
//     console.log('I have it!!!!', evaluation);
//   }
// }

io.on('connection', (socket) => {
  console.log('1. a user connected', socket.id);

  sockets[socket.id] = socket;
  socket.on('setNewPosition', (data) => {
    console.log('2. server->socket: setNewPosition');
    const position = {
      action: 'findBestMove',
      userId: socket.id,
      fen: data.FEN,
    };

    positionModel.findAllMoves(data.FEN).then((evaluation) => {
      if (evaluation === null) {
        sender.send(JSON.stringify(position));
      } else {
        const bestVariant = positionModel.getBestVariant(evaluation);
        console.log('I have it!!!!', bestVariant);

        socket.emit('on_result', {
          fen: data.FEN, data: JSON.parse(bestVariant)
        });
      }
    });
  });

  socket.on('disconnect', () => {
    console.log('Server: user disconnected', socket.id);
    delete sockets[socket.id];
  });
});
