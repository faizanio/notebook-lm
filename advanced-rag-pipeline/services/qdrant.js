import { QdrantClient } from "@qdrant/js-client-rest";
import { config } from "../config/config.js";



const client = new QdrantClient({
    url: config.QDRANT_URL,
    apiKey: config.QDRANT_API_KEY,
})

const COLLECTION = config.QDRANT_COLLECTION

export async function createCollectionIfNotExists() {
    if (!COLLECTION) {
        throw new Error('QDRANT_COLLECTION is not defined in config')
    }

    const collections = await client.getCollections()

    const exists = collections.collections.find(
        e => e.name === COLLECTION
    )

    if (exists) return

    await client.createCollection(COLLECTION, {
        vectors: {
            size: 1536,
            distance: 'Cosine'
        }
    })

    console.log("✅ Qdrant Collection Created");
}


export async function storeVectors(chunks, embeddings, meta = {}) {
    await createCollectionIfNotExists()


    const points = chunks.map((c, i) => ({
        id: crypto.randomUUID(),

        vector: embeddings[i],

        payload: {
            text: c,
            sourceId: meta.sourceId || null,
            notebookId: meta.notebookId || null,
            chunkIndex: i,
            // metadata: {}
        }
    }))


    await client.upsert(COLLECTION, {
        wait: true,
        points
    })

    console.log(`✅ Stored ${points.length} vectors`);
}


export async function searchVectors(collectionName, vector, limit = 5, notebookId = null) {
    const response = await client.search(collectionName, {
        vector,
        limit,
        with_payload: true,
        filter: notebookId
            ? { must: [{ key: "notebookId", match: { value: notebookId } }] }
            : undefined
    })

    return response
}

export async function deleteVectorsBySource(sourceId) {
    await client.delete(COLLECTION, {
        wait: true,
        filter: {
            must: [{ key: 'sourceId', match: { value: sourceId } }]
        }
    })

    console.log(`🗑️ Deleted vectors for sourceId: ${sourceId}`);
}