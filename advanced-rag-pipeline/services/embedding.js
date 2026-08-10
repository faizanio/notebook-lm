import OpenAI from "openai";
import { config } from "../config/config.js";


const client = new OpenAI({
    apiKey: config.OPENAI_API_KEY,
})

export async function generateEmbeddigs(chunks){
    const response = await client.embeddings.create({
        model: 'text-embedding-3-small',
        input: chunks
    })

    return response.data.map(e => e.embedding)
}