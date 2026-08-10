import express from 'express'
import cors from 'cors'
import { config } from '../config/config.js'
import 'dotenv/config'

import './worker/indexing.worker.js'
import uploadRoute from './routes/upload.route.js'
import queryRouter from '../src/routes/query.route.js'
import notebookRouter from './routes/notebook.route.js'
import { clerkMiddleware } from '@clerk/express'
import { generalLimiter } from './middlewares/ratelimit.middleware.js'

const app = express()

const allowOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL
].filter(Boolean)

app.use(cors({
  origin: allowOrigins,
  credentials: true,
}))

app.use(express.json())
app.use(clerkMiddleware())
app.use(generalLimiter)

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`)
  next()
})

app.get('/', (req, res) => {
  res.send("OK")
})

app.use('/upload', uploadRoute)
app.use('/query', queryRouter)
app.use("/notebooks", notebookRouter)

app.listen(config.port, () => {
  console.log(`Server listening on http://localhost:${config.port}`)
})