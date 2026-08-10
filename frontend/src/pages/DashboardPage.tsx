import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react'
import { useApi } from '@/hooks/useApi'
import type { Notebook } from '@/types/api'
import { formatRelativeTime } from '@/lib/formatters'
import { CreateNotebookDialog } from '@/components/CreateNotebookDialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Toaster } from '@/components/ui/sonner'
import { BookOpen, Sparkles, Plus, Brain, ArrowRight, ShieldCheck, Calendar, Layers } from 'lucide-react'

export function DashboardPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const api = useApi()

  useEffect(() => {
    document.title = 'NotebookLM RAG — Dashboard'
  }, [])

  // Phase 3 Real GET /notebooks query
  const { data: notebooks, isLoading, isError, error } = useQuery<Notebook[]>({
    queryKey: ['notebooks'],
    queryFn: async () => {
      try {
        const res = await api.get<Notebook[]>('/notebooks')
        return res.data
      } catch (err: any) {
        if (err?.response?.status === 401) {
          console.error('[GET /notebooks] 401 Unauthorized: Clerk session token issue', err)
        }
        throw err
      }
    },
  })

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white flex flex-col font-sans">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-4 sm:px-6 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent leading-none">
              NotebookLM RAG
            </h1>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium mt-0.5">Advanced Knowledge Intelligence</p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <SignedIn>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setCreateDialogOpen(true)}
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/20 gap-1.5 rounded-lg text-xs font-semibold"
              >
                <Plus className="h-4 w-4" /> <span className="hidden sm:inline">New Notebook</span><span className="sm:hidden">New</span>
              </Button>
              <div className="pl-2 border-l border-slate-800">
                <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: 'h-9 w-9' } }} />
              </div>
            </div>
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25 font-semibold text-xs sm:text-sm px-4 sm:px-5 rounded-lg transition-all hover:scale-[1.02]">
                Sign in with Google
              </Button>
            </SignInButton>
          </SignedOut>
        </div>
      </header>

      {/* Dashboard Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10 flex flex-col justify-center">
        <SignedIn>
          <div className="space-y-6">
            {/* Header Title Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/60 pb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
                  <BookOpen className="h-6 w-6 text-indigo-400" />
                  Your Knowledge Notebooks
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Upload documents, run intelligent RAG queries, and extract key insights.
                </p>
              </div>
              <Button
                onClick={() => setCreateDialogOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2 shadow-md text-xs sm:text-sm"
              >
                <Plus className="h-4 w-4" /> Create Notebook
              </Button>
            </div>

            {/* Notebook List Grid / Loading / Error / Empty States */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border border-slate-800 rounded-xl p-6 bg-slate-900/40 space-y-4">
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-9 w-9 rounded-lg bg-slate-800" />
                      <Skeleton className="h-4 w-16 rounded bg-slate-800" />
                    </div>
                    <Skeleton className="h-6 w-3/4 bg-slate-800" />
                    <Skeleton className="h-4 w-1/2 bg-slate-800" />
                  </div>
                ))}
              </div>
            ) : isError ? (
              <div className="p-6 rounded-xl bg-rose-950/30 border border-rose-800/40 text-center space-y-2">
                <p className="text-sm font-bold text-rose-300">Failed to load notebooks</p>
                <p className="text-xs text-slate-400">
                  {(error as any)?.message || 'Check your network or authentication status.'}
                </p>
              </div>
            ) : !notebooks || notebooks.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/30 max-w-lg mx-auto space-y-4 p-6">
                <div className="h-14 w-14 rounded-full bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400 shadow-inner">
                  <Layers className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-200">No notebooks yet</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                    Create your first notebook to begin ingesting documents and running RAG queries.
                  </p>
                </div>
                <Button
                  onClick={() => setCreateDialogOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2 font-semibold text-xs px-5"
                >
                  <Plus className="h-4 w-4" /> Create First Notebook
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                {/* Create Notebook Card Trigger */}
                <div
                  onClick={() => setCreateDialogOpen(true)}
                  className="border border-slate-800 bg-slate-900/40 hover:bg-slate-900/80 hover:border-indigo-500/50 rounded-xl p-6 transition-all border-dashed flex flex-col items-center justify-center text-center min-h-[190px] cursor-pointer group"
                >
                  <div className="h-12 w-12 rounded-full bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Plus className="h-6 w-6 text-indigo-400" />
                  </div>
                  <h3 className="font-semibold text-slate-200 text-sm">New Knowledge Base</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-[200px]">Create a new notebook workspace.</p>
                </div>

                {/* Real Notebook Cards linking to /notebook/:id */}
                {notebooks.map((nb) => (
                  <Link
                    key={nb.id}
                    to={`/notebook/${nb.id}`}
                    className="border border-slate-800 bg-slate-900/60 hover:border-indigo-500/60 rounded-xl p-6 transition-all flex flex-col justify-between hover:shadow-xl hover:shadow-indigo-500/5 group"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:bg-indigo-500/20 transition-colors">
                          <Brain className="h-5 w-5" />
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                          RAG Workspace
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-100 text-base group-hover:text-indigo-400 transition-colors truncate">
                        {nb.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Updated {formatRelativeTime(nb.updatedAt)}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-800/80 flex justify-between items-center text-xs text-slate-400">
                      <span className="text-[11px] text-slate-500 font-mono">Workspace</span>
                      <span className="flex items-center gap-1 text-indigo-400 font-bold group-hover:translate-x-1 transition-transform">
                        Open Workspace <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </SignedIn>

        {/* Signed Out Landing Page View */}
        <SignedOut>
          <div className="relative py-8 sm:py-12 flex flex-col items-center text-center">
            {/* Ambient Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none" />

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-medium mb-6 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" /> Next-Gen AI Notebooks & Document RAG
            </div>

            <h2 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white max-w-3xl leading-tight">
              Transform your documents into <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Conversational Intelligence</span>
            </h2>

            <p className="text-slate-400 text-sm sm:text-base md:text-lg max-w-2xl mt-4 sm:mt-6 leading-relaxed">
              Upload your research papers, notes, and technical documentation. Ask complex questions and get grounded answers powered by advanced vector search.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <SignInButton mode="modal">
                <Button size="lg" className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-xl shadow-indigo-600/25 px-8 h-12 rounded-xl text-base gap-2 hover:scale-[1.02] transition-all">
                  Get Started Free <ArrowRight className="h-5 w-5" />
                </Button>
              </SignInButton>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl w-full mt-12 sm:mt-16 text-left">
              <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm">
                <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4 border border-indigo-500/20">
                  <Brain className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-slate-200 text-base">Intelligent RAG</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">Contextual search powered by state-of-the-art embeddings and vector database querying.</p>
              </div>

              <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm">
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4 border border-purple-500/20">
                  <BookOpen className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-slate-200 text-base">Multi-Doc Notebooks</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">Organize PDFs, markdown, and text notes into curated domain knowledge hubs.</p>
              </div>

              <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/20">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-slate-200 text-base">Secure Authentication</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">Seamless login with Clerk Google auth and user-isolated document storage.</p>
              </div>
            </div>
          </div>
        </SignedOut>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-6 px-6 text-center text-xs text-slate-500">
        Advanced RAG Notebook Platform &copy; {new Date().getFullYear()}
      </footer>

      {/* Create Notebook Dialog */}
      <CreateNotebookDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />

      <Toaster />
    </div>
  )
}
