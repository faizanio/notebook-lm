import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useApi } from '@/hooks/useApi'
import type { Source } from '@/types/api'
import { formatRelativeTime } from '@/lib/formatters'
import { AddSourceDialog } from './AddSourceDialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import {
  Plus,
  FileText,
  FileCode,
  AlignLeft,
  Link as LinkIcon,
  Video,
  RefreshCw,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Database,
  Copy,
  Info,
  ExternalLink
} from 'lucide-react'

interface SourcesPanelProps {
  notebookId: string
}

export function SourcesPanel({ notebookId }: SourcesPanelProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [sourceToDelete, setSourceToDelete] = useState<Source | null>(null)

  const api = useApi()
  const queryClient = useQueryClient()

  // Fetch sources with polling every 3s if any source is UPLOADING or INDEXING
  const { data: sources, isLoading, isError } = useQuery<Source[]>({
    queryKey: ['sources', notebookId],
    queryFn: async () => {
      const res = await api.get<Source[]>(`/notebooks/${notebookId}/source`)
      return res.data
    },
    refetchInterval: (query) => {
      const currentSources = query.state.data
      const isIngesting = currentSources?.some(
        (s) => s.status === 'UPLOADING' || s.status === 'INDEXING'
      )
      return isIngesting ? 3000 : false
    },
  })

  // Delete source mutation
  const deleteMutation = useMutation({
    mutationFn: async (sourceId: string) => {
      const res = await api.delete<{ success: boolean; message?: string }>(
        `/notebooks/${notebookId}/source/${sourceId}`
      )
      return res.data
    },
    onSuccess: (res) => {
      if (res.success !== false) {
        toast.success('Source deleted successfully')
        queryClient.invalidateQueries({ queryKey: ['sources', notebookId] })
      } else {
        toast.error(res.message || 'Failed to delete source')
      }
      setSourceToDelete(null)
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || 'Failed to delete source'
      toast.error(msg)
      setSourceToDelete(null)
    },
  })

  // Reindex source mutation
  const reindexMutation = useMutation({
    mutationFn: async (sourceId: string) => {
      const res = await api.post<{ success: boolean; message?: string; jobId?: string }>(
        `/notebooks/${notebookId}/source/${sourceId}/reindex`
      )
      return res.data
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Reindexing queued')
      queryClient.invalidateQueries({ queryKey: ['sources', notebookId] })
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || 'Failed to trigger reindexing'
      toast.error(msg)
    },
  })

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`Copied ${label} to clipboard`)
  }

  const getSourceIcon = (type: Source['type']) => {
    switch (type) {
      case 'PDF':
        return <FileText className="h-4 w-4 text-rose-400" />
      case 'VTT':
        return <FileCode className="h-4 w-4 text-amber-400" />
      case 'TEXT':
        return <AlignLeft className="h-4 w-4 text-emerald-400" />
      case 'URL':
        return <LinkIcon className="h-4 w-4 text-sky-400" />
      case 'YOUTUBE':
        return <Video className="h-4 w-4 text-red-500" />
      default:
        return <FileText className="h-4 w-4 text-slate-400" />
    }
  }

  const renderStatusBadge = (source: Source) => {
    switch (source.status) {
      case 'READY':
        return (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] gap-1 font-semibold whitespace-nowrap">
            <CheckCircle2 className="h-3 w-3 shrink-0" /> Ready
          </Badge>
        )
      case 'UPLOADING':
      case 'INDEXING':
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[10px] gap-1 animate-pulse font-semibold whitespace-nowrap">
            <Loader2 className="h-3 w-3 animate-spin shrink-0" /> {source.status === 'UPLOADING' ? 'Uploading' : 'Indexing'}
          </Badge>
        )
      case 'FAILED':
        return (
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="outline" className="bg-rose-500/10 text-rose-400 border-rose-500/30 text-[10px] gap-1 font-semibold cursor-help whitespace-nowrap">
                <AlertCircle className="h-3 w-3 shrink-0" /> Failed
              </Badge>
            </TooltipTrigger>
            <TooltipContent className="bg-slate-900 border-slate-800 text-rose-300 max-w-xs text-xs">
              <p className="font-semibold text-rose-400">Processing Error:</p>
              <p className="mt-0.5">{source.errorMessage || 'Unknown indexing error occurred.'}</p>
            </TooltipContent>
          </Tooltip>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col h-full bg-slate-900/60 border-r border-slate-800/80">
      {/* Panel Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-indigo-400" />
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            Sources ({sources?.length || 0})
          </h2>
        </div>
        <Button
          onClick={() => setAddDialogOpen(true)}
          size="sm"
          className="bg-indigo-600 hover:bg-indigo-500 text-white gap-1 text-xs h-8 px-3 shadow-md"
        >
          <Plus className="h-3.5 w-3.5" /> Add Source
        </Button>
      </div>

      {/* Source List Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 border border-slate-800 rounded-xl bg-slate-900/40 space-y-2">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-1/2 bg-slate-800" />
                  <Skeleton className="h-4 w-16 bg-slate-800" />
                </div>
                <Skeleton className="h-3 w-1/3 bg-slate-800" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-800/40 text-center text-xs text-rose-300">
            Failed to load sources for this notebook.
          </div>
        ) : !sources || sources.length === 0 ? (
          <div className="py-12 px-4 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/30 space-y-3">
            <div className="h-10 w-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-400">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-200">No sources yet</p>
              <p className="text-[11px] text-slate-500 max-w-[220px] mx-auto mt-1 leading-relaxed">
                Add your first document to start asking questions.
              </p>
            </div>
            <Button
              onClick={() => setAddDialogOpen(true)}
              variant="outline"
              size="sm"
              className="border-slate-800 text-indigo-400 hover:bg-slate-900 text-xs gap-1"
            >
              <Plus className="h-3.5 w-3.5" /> Add Source
            </Button>
          </div>
        ) : (
          sources.map((source) => (
            <div
              key={source.id}
              className="p-3 rounded-xl border border-slate-800/80 bg-slate-950/50 hover:border-slate-700 transition-all flex flex-col justify-between gap-2.5 group"
            >
              <div className="flex items-start justify-between gap-2.5 min-w-0">
                <div className="flex items-start gap-2.5 min-w-0 flex-1 overflow-hidden">
                  <div className="mt-0.5 p-1.5 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
                    {getSourceIcon(source.type)}
                  </div>

                  <HoverCard>
                    <HoverCardTrigger className="min-w-0 flex-1 overflow-hidden block">
                      <div className="min-w-0 cursor-pointer overflow-hidden">
                        <h4 className="text-xs font-bold text-slate-200 truncate leading-snug hover:text-indigo-400 transition-colors">
                          {source.name}
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {formatRelativeTime(source.createdAt)}
                        </p>
                      </div>
                    </HoverCardTrigger>
                    <HoverCardContent className="bg-slate-900 border-slate-800 text-slate-100 w-72 text-xs space-y-2">
                      <div className="font-bold text-slate-200 flex items-center justify-between">
                        <span className="truncate">{source.name}</span>
                        <Badge variant="outline" className="text-[10px] bg-slate-950 border-slate-800">
                          {source.type}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-[11px] text-slate-400 font-mono">
                        <div className="flex justify-between items-center bg-slate-950 p-1.5 rounded border border-slate-800">
                          <span className="truncate">ID: {source.id}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => copyToClipboard(source.id, 'Source ID')}
                            className="h-5 w-5 text-slate-400 hover:text-white"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        {source.sourceUrl && (
                          <a
                            href={source.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-indigo-400 hover:underline pt-1 text-[11px]"
                          >
                            <ExternalLink className="h-3 w-3" /> View Source Link
                          </a>
                        )}
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                </div>

                <div className="shrink-0 pt-0.5">
                  {renderStatusBadge(source)}
                </div>
              </div>

              {/* Display error message banner if failed */}
              {source.status === 'FAILED' && source.errorMessage && (
                <div className="px-2.5 py-1.5 rounded-lg bg-rose-950/40 border border-rose-800/40 text-[11px] text-rose-300 flex items-start gap-1.5">
                  <Info className="h-3.5 w-3.5 text-rose-400 shrink-0 mt-0.5" />
                  <span className="break-words leading-tight">{source.errorMessage}</span>
                </div>
              )}

              {/* Card Bottom Actions */}
              <div className="pt-2 border-t border-slate-900 flex justify-between items-center text-xs">
                <span className="text-[10px] uppercase font-mono text-slate-500 tracking-wider">
                  {source.type}
                </span>

                <div className="flex items-center gap-1">
                  {/* Reindex Button */}
                  <Button
                    onClick={() => reindexMutation.mutate(source.id)}
                    disabled={
                      source.status === 'UPLOADING' ||
                      source.status === 'INDEXING' ||
                      reindexMutation.isPending
                    }
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-slate-400 hover:text-indigo-400 hover:bg-slate-800/80 rounded-lg"
                    title="Reindex source"
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 ${reindexMutation.isPending ? 'animate-spin text-indigo-400' : ''}`}
                    />
                  </Button>

                  {/* Delete Button */}
                  <Button
                    onClick={() => setSourceToDelete(source)}
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-lg"
                    title="Delete source"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Source Dialog */}
      <AddSourceDialog
        notebookId={notebookId}
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
      />

      {/* Delete Confirmation AlertDialog */}
      <AlertDialog open={!!sourceToDelete} onOpenChange={() => setSourceToDelete(null)}>
        <AlertDialogContent className="sm:max-w-[420px] bg-slate-900 border-slate-800 text-slate-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-rose-400 flex items-center gap-2 font-bold">
              <Trash2 className="h-5 w-5" /> Delete Source
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 text-xs leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-slate-200">"{sourceToDelete?.name}"</span>? This will permanently remove the document and purge its vector embeddings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-3">
            <AlertDialogCancel
              onClick={() => setSourceToDelete(null)}
              className="bg-slate-200 hover:bg-slate-300 text-slate-950 font-bold border-none text-xs"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              onClick={(e) => {
                e.preventDefault()
                if (sourceToDelete) deleteMutation.mutate(sourceToDelete.id)
              }}
              className="bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs gap-1.5"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Deleting...
                </>
              ) : (
                'Confirm Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
