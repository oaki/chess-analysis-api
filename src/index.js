"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require("./config/");
const bootstrap_1 = require("./bootstrap");
process.on('unhandledRejection', function (err) {
    console.log('unhandledRejection', err);
    // Logger.error('unhandledRejection', err);
});
process.on('uncaughtException', function (err) {
    console.log(err);
    // Logger.error('uncaughtException', err);
});
const config = _1.getConfig();
bootstrap_1.initServer().then((server) => {
    console.info(`Server running at: ${config.server.port}`);
})
    .catch((err) => {
    console.error(`Failed to start server. ${err.message}`);
});
