import IORedis from 'ioredis'
import { config } from './config.js'

export const redisConnection = config.REDIS_URL
    ? new IORedis(config.REDIS_URL, { maxRetriesPerRequest: null })
    : new IORedis({
        host: config.REDIS_HOST,
        port: config.REDIS_PORT,
        maxRetriesPerRequest: null,
    })