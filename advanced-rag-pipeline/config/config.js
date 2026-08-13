import 'dotenv/config'

export const config = {
  port: Number(process.env.PORT) || 8000,
  PORT: Number(process.env.PORT) || 8000,

  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: Number(process.env.REDIS_PORT) || 6379,
  REDIS_URL: process.env.REDIS_URL,

  OPENAI_API_KEY: process.env.OPENAI_API_KEY,

  QDRANT_URL: process.env.QDRANT_URL,
  QDRANT_COLLECTION: process.env.QDRANT_COLLECTION,
  QDRANT_API_KEY: process.env.QDRANT_API_KEY,

  DATABASE_URL: process.env.DATABASE_URL,

  CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY,
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,

  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',

  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  CLOUDINARY_URL: process.env.CLOUDINARY_URL,
}