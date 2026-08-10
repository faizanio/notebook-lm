import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { SignedIn, UserButton } from '@clerk/clerk-react'
import { useApi } from '@/hooks/useApi'
import type { NotebookDetail } from '@/types/api'
import { SourcesPanel } from '@/components/SourcesPanel'
import { QueryPanel } from '@/components/QueryPanel'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { ArrowLeft, Brain, AlertTriangle, Database, MessageSquare } from 'lucide-react'

export function NotebookDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [mobileTab, setMobileTab] = useState<'sources' | 'chat'>('chat')
  const api = useApi()

  // Fetch notebook detail
  const { data: notebook, isLoading, error } = useQuery<NotebookDetail>({
    queryKey: ['notebook', id],
    queryFn: async () => {
      if (!id) throw new Error('Notebook ID is missing')
      const res = await api.get<NotebookDetail>(`/notebooks/${id}`)
      return res.data
    },
    enabled: !!id,
  })

  // Dynamic route document title
  useEffect(() => {
    if (notebook?.name) {
      document.title = `${notebook.name} — NotebookLM RAG`
    } else {
      document.title = 'Workspace — NotebookLM RAG'
    }
  }, [notebook])

  const is404 = (error as any)?.response?.status === 404

  if (is404) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="h-16 w-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4 text-rose-400">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-100">Notebook Not Found</h2>
        <p className="text-xs text-slate-400 max-w-sm mt-2 leading-relaxed">
          The requested notebook does not exist or you do not have permission to view it.
        </p>
        <Link to="/" className="mt-6">
          <Button className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2 text-xs">
            <ArrowLeft className="h-4 w-4" /> Return to Dashboard
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden font-sans">
      {/* Workspace Header Bar */}
      <header className="h-14 border-b border-slate-800/80 bg-slate-950 px-4 sm:px-6 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <Link to="/" className="text-slate-400 hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-slate-900 shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <div className="h-5 w-px bg-slate-800 shrink-0" />

          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-7 w-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Brain className="h-4 w-4" />
            </div>
            {isLoading ? (
              <Skeleton className="h-5 w-32 sm:w-40 bg-slate-800" />
            ) : (
              <div className="min-w-0">
                <h1 className="text-xs sm:text-sm font-bold text-slate-100 truncate">
                  {notebook?.name || 'Notebook Workspace'}
                </h1>
              </div>
            )}
          </div>
        </div>

        {/* Mobile View Switcher (Visible on < md screens) */}
        <div className="flex items-center gap-2 md:hidden bg-slate-900 p-1 border border-slate-800 rounded-lg">
          <button
            onClick={() => setMobileTab('sources')}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-md flex items-center gap-1 transition-colors ${
              mobileTab === 'sources' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            <Database className="h-3 w-3" /> Sources
          </button>
          <button
            onClick={() => setMobileTab('chat')}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-md flex items-center gap-1 transition-colors ${
              mobileTab === 'chat' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            <MessageSquare className="h-3 w-3" /> Chat
          </button>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <SignedIn>
            <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: 'h-8 w-8' } }} />
          </SignedIn>
        </div>
      </header>

      {/* Two-Column Main Workspace */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden min-h-0">
        {/* Left Column — Sources Panel (Visible on Desktop OR when mobileTab === 'sources') */}
        <div
          className={`h-full overflow-hidden ${
            mobileTab === 'sources' ? 'block' : 'hidden md:block'
          } md:col-span-4 lg:col-span-3`}
        >
          {id && <SourcesPanel notebookId={id} />}
        </div>

        {/* Right Column — Query / Chat Panel (Visible on Desktop OR when mobileTab === 'chat') */}
        <div
          className={`h-full overflow-hidden ${
            mobileTab === 'chat' ? 'block' : 'hidden md:block'
          } md:col-span-8 lg:col-span-9`}
        >
          {id && <QueryPanel notebookId={id} />}
        </div>
      </main>

      <Toaster />
    </div>
  )
}
