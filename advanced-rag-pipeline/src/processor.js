import { chunkText } from "../services/chunk.js";
import { generateEmbeddigs } from "../services/embedding.js";
import { readPdfText } from "../services/pdf.js";
import { storeVectors } from "../services/qdrant.js";
import { extractText } from "../services/text.js";
import { extractUrl } from "../services/url.js";
import { extractYoutube } from "../services/youtube.js";
import { extractVtt } from "../services/vtt.js";

async function extractContent(jobData) {
    switch (jobData.type) {
        case 'PDF': return await readPdfText(jobData.filepath)
        case 'TEXT': return await extractText(jobData.content)
        case 'YOUTUBE': return await extractYoutube(jobData.url)
        case 'VTT': return await extractVtt(jobData.filepath)
        case 'URL': return await extractUrl(jobData.url)
        default: throw new Error(`Unsupported file type: ${jobData.type}`)
    }
}

export async function processDocument(jobData) {
    console.log("processor started")
    // try {
    // const pdfPath = jobData.filepath || jobData.path
    const { sourceId, notebookId, type } = jobData

    // if (!pdfPath) {
    //     throw new Error('PDF path is missing from job data')
    // }

    // console.log(`Processing PDF at: ${pdfPath}`)
    // const documents = await readPdfText(pdfPath)

    console.log(`Processing ${type} source`)
    const rawText = await extractContent(jobData)

    console.log(`✅ Content extracted (${rawText.length} chars)`);

    console.log("\n✂️ Creating Chunks...");

    const chunks = await chunkText(rawText)

    console.log(`✅ Total Chunks: ${chunks.length}`);

    const embeddings = await generateEmbeddigs(chunks)

    console.log(`✅ Embeddings : ${embeddings.length}`);

    await storeVectors(chunks, embeddings, { sourceId, notebookId })

    console.log("\n🎉 Indexing Completed");

    // } catch (error) {
    //     console.error(error);
    //     throw error
    // }
}