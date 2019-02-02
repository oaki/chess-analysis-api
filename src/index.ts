require('dotenv').config();
import {getConfig} from "./config/";
import {initServer} from "./bootstrap";

process.on('unhandledRejection', function (err) {
    console.log('unhandledRejection', err);
    // Logger.error('unhandledRejection', err);
});

process.on('uncaughtException', function (err) {
    console.log(err);
    // Logger.error('uncaughtException', err);
});

const config = getConfig();

const t = require("./chessBook");
console.log(t);
initServer().then((server) => {
    console.info(`Server running at: ${config.server.port}`);
})
    .catch((err) => {
        console.error(`Failed to start server. ${err.message}`);
    });

