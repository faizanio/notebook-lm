import { Job, Worker } from "bullmq";
import { redisConnection } from "../../config/redis.js";
import { processDocument } from "../processor.js";
import { prisma } from "../../config/prisma.js";


export const indexingWorker = new Worker(
    'document-indexing',
    async (job) => {
        console.log("\n==============================");
        console.log("📄 New Indexing Job");
        console.log("==============================");
        // console.log(job.data)
        // await processDocument(job.data)

        const { sourceId } = job.data

        try {
            await prisma.source.update({
                where: { id: sourceId },
                data: { status: "INDEXING" }
            })

            await processDocument(job.data)

            await prisma.source.update({
                where: { id: sourceId },
                data: { status: 'READY' }
            })

        } catch (error) {
            await prisma.source.update({
                where: { id: sourceId },
                data: { status: 'FAILED', errorMessage: error?.message }
            })

            throw error
        }

        console.log("==============================\n");
    },
    {
        connection: redisConnection,
        concurrency: 3
    }
)


// Only mark FAILED after BullMQ exhausts all retry attempts
indexingWorker.on('failed', async (job, err) => {
    console.error(`❌ Job ${job.id} failed (attempt ${job.attemptsMade}/${job.opts.attempts}):`, err.message)

    if (job.attemptsMade >= job.opts.attempts) {
        const { sourceId } = job.data
        try {
            await prisma.source.update({
                where: { id: sourceId },
                data: { status: 'FAILED', errorMessage: err.message }
            })
        } catch (updateErr) {
            console.error('Failed to update source status after job failure:', updateErr)
        }
    }
})

indexingWorker.on('completed', (job) => {
    console.log(`✅ Job ${job.id} completed`)
})

indexingWorker.on('error', (err) => {
    // Worker-level errors (e.g. Redis connection lost) — not job-specific
    console.error('🚨 Worker error:', err)
})