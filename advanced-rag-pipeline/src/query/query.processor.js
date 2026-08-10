
import OpenAI from "openai"
import { config } from "../../config/config.js"
import { answerPrompt, decompositionPrompt, rewritePrompt, stepBackPrompt } from "../prompts/prompt.js"
import 'dotenv/config'
import { generateEmbeddigs } from "../../services/embedding.js"
import { searchVectors } from "../../services/qdrant.js"
import { prisma } from "../../config/prisma.js"


const openai = new OpenAI({
    apiKey: config.OPENAI_API_KEY
})

const miniModel = 'gpt-4o-mini'

const COLLECTION_NAME = config.QDRANT_COLLECTION

export async function queryProcessor(query, notebookId) {

    // step back

    const stepBackResponse = await openai.chat.completions.create({
        model: miniModel,
        messages: [
            {
                role: 'user',
                content: stepBackPrompt(query)
            }
        ]
    })

    const stepBackQuestion = stepBackResponse.choices[0].message.content

    // decomposition 

    const decompositionResponse = await openai.chat.completions.create({
        model: miniModel,
        response_format: { type: 'json_object' },
        messages: [
            {
                role: 'user',
                content: decompositionPrompt(query)
            }
        ]
    })

    const decompositionQuestion = parseJsonResponse(decompositionResponse.choices[0].message.content)


    // rewritten

    const rewrittenResponse = await openai.chat.completions.create({
        model: miniModel,
        messages: [
            {
                role: 'user',
                content: rewritePrompt(decompositionQuestion)
            }
        ]
    })

    const rewrittenQueries = parseJsonResponse(rewrittenResponse.choices[0].message.content)


    const embeddings = await generateEmbeddigs(rewrittenQueries)


    const searchResultsPerQuery = await Promise.all(
        embeddings.map(e => searchVectors(COLLECTION_NAME, e, 5, notebookId))
    )

    console.log(JSON.stringify(searchResultsPerQuery[0][0], null, 2));

    // flatten + dedupe

    const seen = new Set()
    const retrivedChunks = []

    searchResultsPerQuery.flat().forEach((point) => {
        if (!seen.has(point.id)) {
            seen.add(point.id)
            retrivedChunks.push({
                score: point.score,
                text: point.payload.text,
                sourceId: point.payload.sourceId,
                chunkIndex: point.payload.chunkIndex,
            })
        }
    })

    retrivedChunks.sort((a, b) => b.score - a.score)

    console.log("sourceIds in results:", retrivedChunks.map(c => c.sourceId));


    // context building - top N chunks, capped

    const topChunks = retrivedChunks.slice(0, 5)

    // fetch source metadata for citation info
    const uniqueSourceIds = [...new Set(topChunks.map(c => c.sourceId).filter(Boolean))]
    const sources = await prisma.source.findMany({
        where: { id: { in: uniqueSourceIds } }
    })
    const sourceMap = Object.fromEntries(sources.map(s => [s.id, s]))

    // build citations array — index matches [n] used in context/prompt
    const citations = topChunks.map((c, i) => ({
        marker: i + 1,
        sourceId: c.sourceId,
        sourceName: sourceMap[c.sourceId]?.name || "Unknown source",
        sourceType: sourceMap[c.sourceId]?.type || "Unknown",
        chunkIndex: c.chunkIndex,
        text: c.text,
    }))

    // console.log("topChunks", topChunks)
    const context = topChunks
        .map((c, i) => `[${i + 1}] ${c.text}`)
        .join("\n\n")


    // LLM Answer

    const answerResponse = await openai.chat.completions.create({
        model: miniModel,
        messages: [
            {
                role: 'user',
                content: answerPrompt(query, context)
            }
        ]
    })


    const answer = answerResponse.choices[0].message.content

    return {
        originalQuery: query,
        stepBackQuestion,
        decompositionQuestion,
        rewrittenQueries,
        // retrivedChunks,
        citations,
        answer,
    }
}


function parseJsonResponse(text) {
    const cleaned = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
}