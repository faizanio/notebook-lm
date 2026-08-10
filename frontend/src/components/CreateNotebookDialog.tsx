import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useApi } from '@/hooks/useApi'
import type { Notebook } from '@/types/api'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, Plus } from 'lucide-react'

interface CreateNotebookDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateNotebookDialog({ open, onOpenChange }: CreateNotebookDialogProps) {
  const [name, setName] = useState('')
  const api = useApi()
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: async (notebookName: string) => {
      const res = await api.post<Notebook>('/notebooks', { name: notebookName })
      return res.data
    },
    onSuccess: (data) => {
      toast.success(`Notebook "${data.name}" created!`)
      queryClient.invalidateQueries({ queryKey: ['notebooks'] })
      setName('')
      onOpenChange(false)
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.message || 'Failed to create notebook'
      toast.error(msg)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      toast.error('Notebook name is required')
      return
    }
    createMutation.mutate(trimmed)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-800 text-slate-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-indigo-400">
            <Plus className="h-5 w-5" /> Create New Notebook
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Organize your documents, research papers, and technical guides in a single AI-powered workspace.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="notebook-name" className="text-slate-300">
              Notebook Name
            </Label>
            <Input
              id="notebook-name"
              placeholder="e.g. AI Research & RAG Architecture"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500 focus-visible:ring-indigo-500"
              autoFocus
            />
          </div>

          <DialogFooter className="pt-4">
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
              disabled={createMutation.isPending || !name.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold gap-2"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Creating...
                </>
              ) : (
                'Create Notebook'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
