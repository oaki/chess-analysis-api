const app = require('express')();
const https = require('https');
const fs = require('fs');
const config = require('./config/index');
const positionModel = require('./PositionModel.js');
const zeromq = require('zeromq');

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
  console.log('ssss');
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

    sender.send(JSON.stringify(position));
  });

  // socket.on('setDelay', (delay) => {
  //   engine.setDelay(delay);
  // });

  socket.on('disconnect', () => {
    console.log('Server: user disconnected', socket.id);
    delete sockets[socket.id];
  });
});
