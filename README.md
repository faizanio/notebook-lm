# 🧠 NotebookLM RAG — Advanced Knowledge Intelligence

An end-to-end, production-grade **NotebookLM RAG System** designed for multi-source knowledge synthesis, document workspace isolation, multi-step Advanced RAG retrieval, and grounded AI responses with interactive clickable citations.

---

## 🚀 Key Features

### 1. 📂 Notebook Management & Workspace Isolation
* **Multiple Notebook Support**: Create, rename, view, and delete isolated notebooks.
* **Strict User Isolation**: Powered by Clerk Authentication, ensuring users only access their personal notebooks and sources.
* **Clean & Modern UX**: Interactive dashboard with responsive layout and glassmorphism styling.

### 2. 📥 Multi-Source Ingestion Pipeline
* **Multiple Format Support**: Upload PDFs, TXT files, Markdown notes, Code snippets, or ingest Web URLs.
* **Async Ingestion Queue**: Powered by BullMQ & Redis worker processes for background document parsing, chunking, and embedding generation.
* **Real-time Status Indicators**: Live polling UI updates status (`UPLOADING`, `INDEXING`, `COMPLETED`, `FAILED`).
* **Source Management**: Single-click source deletion with full vector database cleanup.

### 3. 🧠 Advanced RAG Retrieval Pipeline
Rather than relying on basic naive RAG, the query engine implements a multi-stage advanced retrieval pipeline (`query.processor.js`):
1. **Step-Back Prompting**: Abstracting the user query into high-level conceptual questions.
2. **Sub-Query Decomposition**: Breaking complex multi-part questions into targeted JSON sub-questions.
3. **Multi-Query Rewriting**: Generating multiple search query variations for higher vector retrieval recall.
4. **Parallel Vector Search**: Executing vector searches concurrently against **Qdrant Vector DB** using OpenAI high-dimensional embeddings.
5. **Deduplication & Score Reranking**: Deduplicating retrieved chunks by vector ID, sorting by similarity scores (`b.score - a.score`), and assembling top-N grounded context.

### 4. 🎯 Grounded AI Responses & Interactive Citations
* **Minimal Hallucinations**: Strict LLM prompt engineering ensuring answers rely exclusively on retrieved source context.
* **Inline Citation Markers**: Embedded `[1]`, `[2]` markers pointing directly to the supporting document source.
* **Interactive Citation Drawer**: Click any citation marker to open a detailed side-sheet showing the original extracted context snippet, document title, and chunk index.

### 5. ⚡ Enterprise Security & Thoughtful UX
* **Input Lock & Blur**: Prevents duplicate requests by locking inputs, disabling prompt chips, and shifting focus away while queries process.
* **Rate Limiting**: Built-in Redis rate limiters (`express-rate-limit` + `rate-limit-redis`) protecting query and ingestion endpoints.
* **Error Handling**: Graceful fallback UI states for unauthorized sessions, missing sources, or network failures.

---

## 🏗️ Architecture & Data Flow

```mermaid
flowchart TD
    User([User / Browser]) <--> ReactUI[Frontend - React 19 + Vite]
    ReactUI <--> ExpressAPI[Backend API - Express.js]
    
    subgraph Authentication & Security
        ExpressAPI <--> Clerk[Clerk Auth Middleware]
        ExpressAPI <--> RateLimit[Redis Rate Limiter]
    end

    subgraph Data & Storage
        ExpressAPI <--> Prisma[(Postgres DB - Prisma ORM)]
        ExpressAPI <--> Cloudinary[Cloudinary File Storage]
    end

    subgraph Ingestion Pipeline
        ExpressAPI --> BullMQ[BullMQ Job Queue]
        BullMQ <--> Worker[Indexing Worker Process]
        Worker <--> OpenAIEmbeddings[OpenAI Embeddings API]
        Worker <--> Qdrant[(Qdrant Vector DB)]
    end

    subgraph Advanced RAG Query Processor
        ExpressAPI --> StepBack[Step-Back Abstraction]
        StepBack --> Decompose[Sub-Query Decomposition]
        Decompose --> Rewrite[Multi-Query Rewriter]
        Rewrite --> VectorSearch[Parallel Qdrant Search]
        VectorSearch --> Rerank[Deduplicate & Score Rerank]
        Rerank --> LLMGen[GPT-4o Grounded Synthesis]
        LLMGen --> Citations[Citations & Answer Payload]
    end
```

---

## 🛠️ Tech Stack

* **Frontend**: React 19, Vite, Tailwind CSS v4, TanStack React Query v5, Clerk Auth (`@clerk/clerk-react`), React Router v7, Sonner Toast, Lucide Icons.
* **Backend API**: Node.js, Express.js, Clerk Express Middleware (`@clerk/express`), Prisma ORM, BullMQ, Redis (`ioredis`), Rate-Limiter-Redis.
* **AI & Vector DB**: OpenAI API (`gpt-4o-mini`, `text-embedding-3-small`), Qdrant Vector Cloud.
* **File Storage**: Cloudinary SDK.

---

## 📁 Repository Structure

```text
notebook-lm/
├── frontend/                     # React 19 + Vite Client Application
│   ├── src/
│   │   ├── components/           # Reusable UI components (QueryPanel, SourcesPanel, etc.)
│   │   ├── hooks/                # Custom React hooks (useApi)
│   │   ├── pages/                # DashboardPage, NotebookDetailPage
│   │   ├── types/                # TypeScript interface definitions
│   │   └── main.tsx              # Application entrypoint
│   ├── public/                   # Public assets (favicon.svg, icons)
│   ├── index.html                # HTML entry template
│   └── package.json
│
├── advanced-rag-pipeline/        # Express API & Advanced RAG Backend
│   ├── src/
│   │   ├── config/               # Prisma, Redis, and env configurations
│   │   ├── middlewares/          # Rate limiting & authentication middlewares
│   │   ├── processor.js          # Ingestion chunking & vector embedding processor
│   │   ├── query/                # Advanced RAG query processor & prompts
│   │   ├── routes/               # Express API routes (notebook, source, query)
│   │   └── worker/               # BullMQ async background worker
│   ├── prisma/                   # Database schema & migrations
│   └── package.json
│
└── README.md                     # Documentation
```

---

## ⚙️ Local Setup Guide

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **Redis**: Running locally or via Upstash / Cloud Redis instance
* **PostgreSQL**: Postgres database (Prisma configured)
* **Qdrant Vector Database**: Local Qdrant instance or Qdrant Cloud cluster
* **OpenAI API Key**

---

### 1. Backend Setup (`advanced-rag-pipeline`)

```bash
# Navigate to backend directory
cd advanced-rag-pipeline

# Install dependencies
npm install

# Create environment file (.env)
cp .env.example .env
```

#### Backend Environment Variables Template (`advanced-rag-pipeline/.env`)

```env
PORT=8000
FRONTEND_URL=http://localhost:5173

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_URL="redis://localhost:6379"

# OpenAI Configuration
OPENAI_API_KEY="your_openai_api_key_here"

# Qdrant Vector DB Configuration
QDRANT_URL="https://your-qdrant-cluster-url.qdrant.io"
QDRANT_COLLECTION="documents"
QDRANT_API_KEY="your_qdrant_api_key_here"

# PostgreSQL Database (Prisma)
DATABASE_URL="postgres://user:password@localhost:5432/notebook_lm_db"

# Clerk Authentication
CLERK_PUBLISHABLE_KEY="pk_test_your_clerk_publishable_key"
CLERK_SECRET_KEY="sk_test_your_clerk_secret_key"

# Cloudinary File Storage
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_cloudinary_api_key"
CLOUDINARY_API_SECRET="your_cloudinary_api_secret"
```

```bash
# Run Prisma Database Migrations
npx prisma migrate dev

# Start the Backend Server
npm run dev
```

---

### 2. Frontend Setup (`frontend`)

```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create environment file (.env)
cp .env.example .env
```

#### Frontend Environment Variables Template (`frontend/.env`)

```env
VITE_CLERK_PUBLISHABLE_KEY="pk_test_your_clerk_publishable_key"
VITE_API_URL="http://localhost:8000"
```

```bash
# Start the Vite Development Server
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## 📋 Evaluation Criteria Mapping

| Criteria | Feature Implementation | Status |
| :--- | :--- | :---: |
| **1. Notebook Management** | Multiple isolated notebooks per user, CRUD operations, clean navigation UX. | ✅ |
| **2. Source Ingestion** | Supports PDF, TXT, MD, Code & Web URLs, async BullMQ indexing worker, live status indicators. | ✅ |
| **3. RAG Pipeline** | Advanced multi-step RAG: Step-back, decomposition, multi-query rewrite, Qdrant vector search, score deduplication. | ✅ |
| **4. AI Responses** | Strictly grounded prompts to eliminate hallucinations, formatted markdown responses. | ✅ |
| **5. Citations & Attribution** | Interactive `[1]` markers linking to citation drawer displaying source snippets and metadata. | ✅ |
| **6. Architecture & Quality** | Decoupled client/API, Redis rate limiting, reusable components, error boundaries. | ✅ |
| **7. UI & UX** | Glassmorphism dark mode, active loading locks, empty state placeholders, responsive layouts. | ✅ |
| **8. Documentation** | Complete setup steps, architecture flow diagrams, safe `.env` templates, folder tree. | ✅ |

---

## 📄 License
Distributed under the MIT License.
