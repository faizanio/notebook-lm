import 'dotenv/config'

export const config = {
  port: Number(process.env.PORT) || 8000,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  QDRANT_URL: process.env.QDRANT_URL,
  QDRANT_COLLECTION: process.env.QDRANT_COLLECTION
}