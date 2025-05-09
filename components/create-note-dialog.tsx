"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import api from "@/lib/api";
import {Note} from "@/types";
import {useToast} from "@/hooks/use-toast";

interface CreateNoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateNoteDialog({ open, onOpenChange }: CreateNoteDialogProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
    const {toast} = useToast();
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      setIsLoading(true)

      try {
          const res = await api.post<Note>("/boards/create", {
              title,
              description
          })
          setTitle("")
          setDescription("")
          console.log(res.data);
          router.push(`/dashboard/note/${res.data.id}`)
      } catch (e) {
          toast({
              title: "Failed to create note",
              description: (e as Error).message,
          })
      } finally {
          setIsLoading(false)
          onOpenChange(false)
      }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create new note</DialogTitle>
            <DialogDescription>Create a new whiteboard note to start collaborating.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter note title"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter note description"
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !title}>
              {isLoading ? "Creating..." : "Create note"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

