import { Queue } from 'bullmq'
import { redisConnection } from '../../config/redis.js'

export const indexingQueue = new Queue('document-indexing', {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 5000,
        },
        removeOnComplete: {
            age: 24 * 3600,
            count: 1000
        },
        removeOnFail: false
    }
})