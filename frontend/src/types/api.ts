export interface Notebook {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  userId: string
}

export type SourceType = 'PDF' | 'TEXT' | 'URL' | 'YOUTUBE' | 'VTT'
export type SourceStatus = 'UPLOADING' | 'INDEXING' | 'READY' | 'FAILED'

export interface Source {
  id: string
  notebookId: string
  type: SourceType
  name: string
  status: SourceStatus
  originalPath: string | null
  content: string | null
  sourceUrl: string | null
  errorMessage: string | null
  createdAt: string
  updatedAt: string
}

export interface NotebookDetail extends Notebook {
  sources: Source[]
}

export interface Citation {
  marker: number
  sourceId: string
  sourceName: string
  sourceType: SourceType
  chunkIndex: number
  text: string
}

export interface DecompositionQuestion {
  questions: string[]
}

export interface QueryResponse {
  originalQuery: string
  stepBackQuestion: string
  decompositionQuestion: DecompositionQuestion
  rewrittenQueries: string[]
  citations: Citation[]
  answer: string
}

export interface UploadResponse {
  success: boolean
  message: string
  jobId: string
  sourceId: string
}

export interface ActionResponse {
  success: boolean
  message?: string
  jobId?: string
}
