import { useState, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useApi } from '@/hooks/useApi'
import type { SourceType, UploadResponse } from '@/types/api'
import { formatFileSize, isValidUrl, isValidYoutubeUrl } from '@/lib/formatters'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import {
  FileText,
  Link as LinkIcon,
  Video,
  AlignLeft,
  Upload,
  Loader2,
  FileCode,
  X,
  UploadCloud,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'

interface AddSourceDialogProps {
  notebookId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddSourceDialog({ notebookId, open, onOpenChange }: AddSourceDialogProps) {
  const [activeTab, setActiveTab] = useState<SourceType>('PDF')
  const [file, setFile] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)

  const [textContent, setTextContent] = useState('')
  const [textName, setTextName] = useState('')
  const [url, setUrl] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const api = useApi()
  const queryClient = useQueryClient()

  const uploadMutation = useMutation({
    mutationFn: async () => {
      setUploadProgress(0)

      if (activeTab === 'PDF' || activeTab === 'VTT') {
        if (!file) throw new Error('Please select a file to upload')
        const formData = new FormData()
        formData.append('document', file)
        formData.append('notebookId', notebookId)
        formData.append('type', activeTab)

        const res = await api.post<UploadResponse>('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
              setUploadProgress(percent)
            }
          },
        })
        return res.data
      } else if (activeTab === 'TEXT') {
        if (textContent.trim().length < 10) {
          throw new Error('Text content must be at least 10 characters long')
        }
        const payload = {
          notebookId,
          type: 'TEXT',
          content: textContent.trim(),
          ...(textName.trim() ? { name: textName.trim() } : {}),
        }
        const res = await api.post<UploadResponse>('/upload', payload)
        return res.data
      } else if (activeTab === 'URL') {
        if (!isValidUrl(url.trim())) {
          throw new Error('Please enter a valid HTTP or HTTPS URL')
        }
        const res = await api.post<UploadResponse>('/upload', {
          notebookId,
          type: 'URL',
          url: url.trim(),
        })
        return res.data
      } else if (activeTab === 'YOUTUBE') {
        if (!isValidYoutubeUrl(youtubeUrl.trim())) {
          throw new Error('Please enter a valid YouTube video URL (youtube.com or youtu.be)')
        }
        const res = await api.post<UploadResponse>('/upload', {
          notebookId,
          type: 'YOUTUBE',
          url: youtubeUrl.trim(),
        })
        return res.data
      }
      throw new Error('Invalid source type')
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Source added successfully and indexing queued!')
      queryClient.invalidateQueries({ queryKey: ['sources', notebookId] })
      queryClient.invalidateQueries({ queryKey: ['notebook', notebookId] })
      resetForm()
      onOpenChange(false)
    },
    onError: (error: any) => {
      setUploadProgress(null)
      const msg = error?.response?.data?.message || error?.message || 'Failed to add source'
      toast.error(msg)
    },
  })

  const resetForm = () => {
    setFile(null)
    setIsDragOver(false)
    setUploadProgress(null)
    setTextContent('')
    setTextName('')
    setUrl('')
    setYoutubeUrl('')
  }

  const validateAndSetFile = (selectedFile: File) => {
    const isPdfTab = activeTab === 'PDF'
    const isVttTab = activeTab === 'VTT'

    if (isPdfTab && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Invalid file format. Only .pdf files are accepted in this tab.')
      return
    }

    if (isVttTab && !selectedFile.name.toLowerCase().endsWith('.vtt')) {
      toast.error('Invalid file format. Only .vtt files are accepted in this tab.')
      return
    }

    setFile(selectedFile)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0])
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    uploadMutation.mutate()
  }

  // Pre-submit validation states
  const isTextValid = activeTab === 'TEXT' ? textContent.trim().length >= 10 : true
  const isUrlValid = activeTab === 'URL' ? isValidUrl(url.trim()) : true
  const isYoutubeValid = activeTab === 'YOUTUBE' ? isValidYoutubeUrl(youtubeUrl.trim()) : true
  const isFileValid = (activeTab === 'PDF' || activeTab === 'VTT') ? !!file : true

  const isSubmitDisabled = uploadMutation.isPending || !isTextValid || !isUrlValid || !isYoutubeValid || !isFileValid

  return (
    <Dialog open={open} onOpenChange={(val) => { resetForm(); onOpenChange(val); }}>
      <DialogContent className="sm:max-w-[540px] bg-slate-900 border-slate-800 text-slate-100 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-indigo-400 font-bold">
            <Upload className="h-5 w-5" /> Add Knowledge Source
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-xs">
            Add documents, websites, notes, or video transcripts to train your RAG notebook.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(val) => {
            setActiveTab(val as SourceType)
            setFile(null)
          }}
          className="w-full mt-2"
        >
          <TabsList className="grid grid-cols-5 bg-slate-950 p-1 border border-slate-800 rounded-lg">
            <TabsTrigger value="PDF">
              <FileText className="h-3.5 w-3.5" /> PDF
            </TabsTrigger>
            <TabsTrigger value="VTT">
              <FileCode className="h-3.5 w-3.5" /> VTT
            </TabsTrigger>
            <TabsTrigger value="TEXT">
              <AlignLeft className="h-3.5 w-3.5" /> Text
            </TabsTrigger>
            <TabsTrigger value="URL">
              <LinkIcon className="h-3.5 w-3.5" /> URL
            </TabsTrigger>
            <TabsTrigger value="YOUTUBE">
              <Video className="h-3.5 w-3.5" /> YouTube
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* PDF / VTT Dropzone */}
            {(activeTab === 'PDF' || activeTab === 'VTT') && (
              <div className="space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={activeTab === 'PDF' ? '.pdf' : '.vtt'}
                  onChange={(e) => {
                    if (e.target.files?.[0]) validateAndSetFile(e.target.files[0])
                  }}
                  className="hidden"
                />

                {!file ? (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                      isDragOver
                        ? 'border-indigo-500 bg-indigo-500/10'
                        : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-950'
                    }`}
                  >
                    <div className="h-12 w-12 rounded-full bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center mb-2 text-indigo-400">
                      <UploadCloud className="h-6 w-6" />
                    </div>
                    <p className="text-xs font-bold text-slate-200">
                      Drag & drop your {activeTab} file here
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      or <span className="text-indigo-400 font-semibold underline">click to browse</span> (Max {activeTab === 'PDF' ? '.pdf' : '.vtt'})
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {activeTab === 'PDF' ? <FileText className="h-5 w-5" /> : <FileCode className="h-5 w-5" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-200 truncate">{file.name}</p>
                        <p className="text-[11px] text-slate-500">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setFile(null)}
                      className="h-8 w-8 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-lg"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* File Upload Progress */}
                {uploadProgress !== null && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                      <span>Uploading document...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2 bg-slate-950 [&>div]:bg-indigo-600" />
                  </div>
                )}
              </div>
            )}

            {/* TEXT Tab */}
            {activeTab === 'TEXT' && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-slate-300 text-xs font-medium">Source Title (Optional)</Label>
                  <Input
                    placeholder="e.g. System Design Notes"
                    value={textName}
                    onChange={(e) => setTextName(e.target.value)}
                    className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label className="text-slate-300 text-xs font-medium">Text Content *</Label>
                    <span
                      className={`text-[11px] font-medium ${
                        textContent.trim().length >= 10 ? 'text-emerald-400' : 'text-slate-500'
                      }`}
                    >
                      {textContent.trim().length} / 10 min chars
                    </span>
                  </div>
                  <Textarea
                    placeholder="Paste raw notes, markdown snippets, or technical documentation (at least 10 characters)..."
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    rows={6}
                    className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500 font-mono text-xs focus-visible:ring-indigo-500"
                  />
                  {textContent.length > 0 && textContent.trim().length < 10 && (
                    <p className="text-[11px] text-amber-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> Text must be at least 10 characters long.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* URL Tab */}
            {activeTab === 'URL' && (
              <div className="space-y-2">
                <Label className="text-slate-300 text-xs font-medium">Web Page URL *</Label>
                <Input
                  placeholder="https://example.com/docs/rag-architecture"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500 text-xs"
                />
                {url.trim().length > 0 && !isValidUrl(url.trim()) && (
                  <p className="text-[11px] text-rose-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Please enter a valid URL starting with http:// or https://
                  </p>
                )}
              </div>
            )}

            {/* YOUTUBE Tab */}
            {activeTab === 'YOUTUBE' && (
              <div className="space-y-2">
                <Label className="text-slate-300 text-xs font-medium">YouTube Video URL *</Label>
                <Input
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500 text-xs"
                />
                {youtubeUrl.trim().length > 0 && !isValidYoutubeUrl(youtubeUrl.trim()) && (
                  <p className="text-[11px] text-rose-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> URL must be a valid YouTube link (e.g. youtube.com or youtu.be)
                  </p>
                )}
              </div>
            )}

            <div className="pt-3 flex justify-end gap-3 border-t border-slate-800/80">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-950 font-bold border-none text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitDisabled}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold gap-2 text-xs"
              >
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Ingesting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> Add & Ingest Source
                  </>
                )}
              </Button>
            </div>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
