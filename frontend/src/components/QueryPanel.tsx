import { useState, useRef, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useApi } from '@/hooks/useApi'
import type { QueryResponse, Citation } from '@/types/api'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { toast } from 'sonner'
import {
  Send,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
  Bookmark,
  Bot,
  User,
  Quote,
  MessageSquarePlus,
  Info
} from 'lucide-react'

interface QueryPanelProps {
  notebookId: string
}

interface ChatMessage {
  id: string
  query: string
  response?: QueryResponse
  error?: string
  timestamp: Date
}

const EXAMPLE_PROMPTS = [
  'Summarize the key insights across all documents',
  'What are the main architecture patterns discussed?',
  'Extract the critical recommendations and action items',
]

export function QueryPanel({ notebookId }: QueryPanelProps) {
  const [inputQuery, setInputQuery] = useState('')
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null)
  const [expandedPipeline, setExpandedPipeline] = useState<Record<string, boolean>>({})

  const chatEndRef = useRef<HTMLDivElement>(null)
  const api = useApi()

  const queryMutation = useMutation({
    mutationFn: async (queryText: string) => {
      const res = await api.post<QueryResponse>('/query', {
        notebookId,
        query: queryText,
      })
      return res.data
    },
    onSuccess: (data, queryText) => {
      setChatHistory((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(2, 9),
          query: queryText,
          response: data,
          timestamp: new Date(),
        },
      ])
      setInputQuery('')
    },
    onError: (error: any, queryText) => {
      const status = error?.response?.status
      let msg = 'Failed to execute query. Please try again.'
      if (status === 401) {
        msg = 'Session expired. Please sign in again.'
      } else if (status === 404) {
        msg = 'Notebook not found or access denied.'
      } else if (error?.response?.data?.message) {
        msg = error.response.data.message
      }
      toast.error(msg)
      setChatHistory((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(2, 9),
          query: queryText,
          error: msg,
          timestamp: new Date(),
        },
      ])
    },
  })

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory, queryMutation.isPending])

  const handleSubmit = (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault()
    const textToSend = customQuery || inputQuery
    const trimmed = textToSend.trim()
    if (!trimmed || queryMutation.isPending) return
    queryMutation.mutate(trimmed)
  }

  const togglePipelineExpand = (msgId: string) => {
    setExpandedPipeline((prev) => ({ ...prev, [msgId]: !prev[msgId] }))
  }

  // Render formatted answer with clickable [1], [2] citation markers
  const renderFormattedAnswer = (answer: string, citations: Citation[]) => {
    // Check if response is standard "I don't know" or has empty citations
    const isUnknown = answer.toLowerCase().includes("don't know") || answer.toLowerCase().includes("no information")

    const parts = answer.split(/(\[\d+\])/g)

    return (
      <div className="space-y-3">
        <div className="leading-relaxed">
          {parts.map((part, idx) => {
            const match = part.match(/^\[(\d+)\]$/)
            if (match) {
              const markerNum = parseInt(match[1], 10)
              const citation = citations?.find((c) => c.marker === markerNum)

              return (
                <button
                  key={idx}
                  onClick={() => citation && setSelectedCitation(citation)}
                  className="inline-flex items-center mx-0.5 px-1.5 py-0.5 rounded text-[11px] font-bold bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 transition-colors cursor-pointer"
                  title={citation ? `Source: ${citation.sourceName}` : `Citation ${markerNum}`}
                >
                  [{markerNum}]
                </button>
              )
            }
            return <span key={idx}>{part}</span>
          })}
        </div>

        {/* Note if no relevant citations found */}
        {isUnknown && (!citations || citations.length === 0) && (
          <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-800/30 text-amber-300 text-xs flex items-start gap-2">
            <Info className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
            <span>
              No relevant information found in your sources for this question. Try adding more documents or rewording your prompt.
            </span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/80 backdrop-blur">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-indigo-400" />
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            RAG Conversation & Query
          </h2>
        </div>
        <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-[11px] font-semibold">
          Multi-Step RAG
        </Badge>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {chatHistory.length === 0 && !queryMutation.isPending && (
          <div className="py-16 px-4 text-center max-w-lg mx-auto space-y-6">
            <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400 shadow-inner">
              <Bot className="h-7 w-7" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-slate-200">Ask a question about your sources</h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                Queries decompose complex questions and query your vector embeddings to output grounded citations.
              </p>
            </div>

            {/* Example Prompt Chips */}
            <div className="space-y-2 pt-2">
              <p className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">
                Try asking:
              </p>
              <div className="flex flex-col gap-2">
                {EXAMPLE_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInputQuery(prompt)
                      handleSubmit(undefined, prompt)
                    }}
                    className="p-3 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900 hover:border-indigo-500/40 text-xs text-slate-300 text-left transition-all flex items-center justify-between group"
                  >
                    <span className="truncate pr-2">{prompt}</span>
                    <MessageSquarePlus className="h-3.5 w-3.5 text-slate-500 group-hover:text-indigo-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {chatHistory.map((msg) => (
          <div key={msg.id} className="space-y-4">
            {/* User Prompt */}
            <div className="flex justify-end items-start gap-3">
              <div className="bg-indigo-600/90 text-white rounded-2xl rounded-tr-none px-4 py-3 text-sm max-w-2xl shadow-md">
                {msg.query}
              </div>
              <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-slate-300" />
              </div>
            </div>

            {/* Assistant Answer or Error */}
            <div className="flex justify-start items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0 text-indigo-400">
                <Bot className="h-4 w-4" />
              </div>

              <div className="space-y-3 max-w-3xl min-w-0 flex-1">
                {msg.error ? (
                  <div className="bg-rose-950/40 border border-rose-800/40 text-rose-300 rounded-2xl rounded-tl-none p-4 text-xs">
                    {msg.error}
                  </div>
                ) : msg.response ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none p-5 space-y-4 shadow-md">
                    {/* Main Answer */}
                    <div className="text-sm text-slate-200">
                      {renderFormattedAnswer(msg.response.answer, msg.response.citations)}
                    </div>

                    {/* Citations List Bar */}
                    {msg.response.citations && msg.response.citations.length > 0 && (
                      <div className="pt-3 border-t border-slate-800/80">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Bookmark className="h-3.5 w-3.5 text-indigo-400" /> Citations & Sources ({msg.response.citations.length})
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {msg.response.citations.map((citation) => (
                            <button
                              key={citation.marker}
                              onClick={() => setSelectedCitation(citation)}
                              className="text-xs bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg px-2.5 py-1.5 flex items-center gap-2 transition-all text-slate-300 text-left"
                            >
                              <Badge variant="outline" className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-[10px]">
                                [{citation.marker}]
                              </Badge>
                              <span className="truncate max-w-[160px] font-medium text-slate-200">
                                {citation.sourceName}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* RAG Pipeline Breakdown (Collapsible) */}
                    <div className="pt-2">
                      <button
                        onClick={() => togglePipelineExpand(msg.id)}
                        className="text-xs text-slate-400 hover:text-indigo-400 flex items-center gap-1 font-medium transition-colors"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        {expandedPipeline[msg.id] ? 'Hide RAG Pipeline Details' : 'View RAG Pipeline Insights'}
                        {expandedPipeline[msg.id] ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </button>

                      {expandedPipeline[msg.id] && (
                        <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs text-slate-300">
                          {msg.response.stepBackQuestion && (
                            <div>
                              <span className="font-bold text-indigo-400">Step-Back Question:</span>
                              <p className="text-slate-400 mt-0.5">{msg.response.stepBackQuestion}</p>
                            </div>
                          )}

                          {msg.response.rewrittenQueries?.length > 0 && (
                            <div>
                              <span className="font-bold text-indigo-400">Rewritten Queries:</span>
                              <ul className="list-disc list-inside text-slate-400 mt-0.5 space-y-0.5">
                                {msg.response.rewrittenQueries.map((q, i) => (
                                  <li key={i}>{q}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {msg.response.decompositionQuestion?.questions?.length > 0 && (
                            <div>
                              <span className="font-bold text-indigo-400">Decomposed Sub-questions:</span>
                              <ul className="list-disc list-inside text-slate-400 mt-0.5 space-y-0.5">
                                {msg.response.decompositionQuestion.questions.map((subQ, i) => (
                                  <li key={i}>{subQ}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ))}

        {/* Distinct Thinking / Pipeline Execution Loading Indicator */}
        {queryMutation.isPending && (
          <div className="flex justify-start items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0 text-indigo-400">
              <Bot className="h-4 w-4" />
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none p-4 text-xs text-slate-300 flex items-center gap-3 shadow-lg">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-400 shrink-0" />
              <div className="space-y-0.5">
                <p className="font-bold text-slate-200">Thinking & Retrieving...</p>
                <p className="text-[11px] text-slate-400">
                  Decomposing query, running vector search, and generating grounded answer.
                </p>
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/80">
        <form onSubmit={handleSubmit} className="relative">
          <Textarea
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit()
              }
            }}
            placeholder="Ask a question about your uploaded sources... (Press Enter to send)"
            rows={2}
            className="bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-500 pr-14 text-xs rounded-xl focus-visible:ring-indigo-500 resize-none"
          />
          <Button
            type="submit"
            disabled={queryMutation.isPending || !inputQuery.trim()}
            size="icon"
            className="absolute right-2.5 bottom-2.5 h-8 w-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all"
          >
            {queryMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>

      {/* Citation Detail Sheet */}
      <Sheet open={!!selectedCitation} onOpenChange={() => setSelectedCitation(null)}>
        <SheetContent className="bg-slate-900 border-slate-800 text-slate-100 sm:max-w-[500px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-indigo-400 text-base font-bold">
              <Quote className="h-5 w-5" /> Citation [{selectedCitation?.marker}] Details
            </SheetTitle>
            <SheetDescription className="text-slate-400 text-xs">
              Extracted chunk reference matched by vector retrieval.
            </SheetDescription>
          </SheetHeader>

          {selectedCitation && (
            <div className="mt-6 space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">{selectedCitation.sourceName}</span>
                  <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/30 text-[10px]">
                    {selectedCitation.sourceType}
                  </Badge>
                </div>
                <div className="text-[11px] text-slate-500">
                  Chunk Index: <span className="text-slate-300 font-mono">#{selectedCitation.chunkIndex}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-slate-400 font-bold text-[11px] uppercase tracking-wider">
                  Extracted Context Snippet
                </label>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 leading-relaxed font-sans text-xs whitespace-pre-wrap">
                  "{selectedCitation.text}"
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
