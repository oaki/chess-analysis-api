import * as redis from 'redis';
import * as util from 'util';

const redisClient = redis.createClient();
export const hmset = util.promisify(redisClient.hmset).bind(redisClient);
export const exists = util.promisify(redisClient.exists).bind(redisClient);
export const hgetall = util.promisify(redisClient.hgetall).bind(redisClient);