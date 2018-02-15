"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis = require("redis");
const util = require("util");
const redisClient = redis.createClient();
exports.hmset = util.promisify(redisClient.hmset).bind(redisClient);
exports.exists = util.promisify(redisClient.exists).bind(redisClient);
exports.hgetall = util.promisify(redisClient.hgetall).bind(redisClient);
