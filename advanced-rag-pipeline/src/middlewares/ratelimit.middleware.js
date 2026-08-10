import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { redisConnection } from "../../config/redis.js";


function makeLimiter({ windowMs, max, message }) {
    return rateLimit({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req) => req.auth?.userId || req.ip,
        store: new RedisStore({
            sendCommand: (...args) => redisConnection.call(...args),
            prefix: 'rl:'
        }),
        message: { success: false, message },
        handler: (req, res, next, options) => {
            res.status(429).json(options.message)
        }
    })
}

export const uploadLimiter = makeLimiter({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: 'Upload limit reached. Try again after an hour'
})

export const queryLimiter = makeLimiter({
    windowMs: 60 * 1000,
    max: 7,
    message: 'Query limit reached. Try again later'
})

export const generalLimiter = makeLimiter({
    windowMs: 60 * 1000,
    max: 100,
    message: 'Too many request'
})