import 'reflect-metadata';
import 'dotenv/config';
import {initServer} from "./bootstrap";
import {logger} from "./libs/logger";

process.on('unhandledRejection', (err) => {
    logger.error({err}, 'unhandledRejection');
});

process.on('uncaughtException', (err) => {
    logger.error({err}, 'uncaughtException');
});

initServer().catch((err) => {
    logger.error({err}, 'Failed to start server');
    process.exit(1);
});
