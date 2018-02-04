const redis = require('redis');
const redisClient = redis.createClient();
const {promisify} = require('util');
const hmset = promisify(redisClient.hmset).bind(redisClient);
const exists = promisify(redisClient.exists).bind(redisClient);
const hgetall = promisify(redisClient.hgetall).bind(redisClient);


module.exports = {
  hmset,
  exists,
  hgetall,
}