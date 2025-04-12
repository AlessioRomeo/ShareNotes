"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Share2, Copy, Check, Plus } from "lucide-react"

interface ShareNoteDialogProps {
  noteId: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ShareNoteDialog({ noteId, open, onOpenChange }: ShareNoteDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [copied, setCopied] = useState(false)
  const [sharedUsers, setSharedUsers] = useState<string[]>([])
  const [internalOpen, setInternalOpen] = useState(false)

  // Handle both controlled and uncontrolled modes
  const isControlled = open !== undefined && onOpenChange !== undefined
  const isOpen = isControlled ? open : internalOpen
  const setIsOpen = isControlled ? onOpenChange : setInternalOpen

  const shareLink = `https://notecanvas.app/shared/${noteId}`

  const handleShare = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate sharing
    setTimeout(() => {
      setIsLoading(false)
      setSharedUsers([...sharedUsers, email])
      setEmail("")
    }, 1000)
  }

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Share note</DialogTitle>
          <DialogDescription>Share this note with others to collaborate in real-time.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Share link</Label>
            <div className="flex items-center gap-2">
              <Input value={shareLink} readOnly />
              <Button variant="outline" size="icon" onClick={copyLink} className="shrink-0">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span className="sr-only">Copy link</span>
              </Button>
            </div>
          </div>
          <form onSubmit={handleShare}>
            <div className="grid gap-2">
              <Label htmlFor="email">Invite via email</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                />
                <Button type="submit" disabled={isLoading || !email} className="shrink-0">
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>
          </form>
          {sharedUsers.length > 0 && (
            <div className="grid gap-2">
              <Label>Shared with</Label>
              <div className="border rounded-md divide-y">
                {sharedUsers.map((user, index) => (
                  <div key={index} className="flex items-center justify-between p-2">
                    <span className="text-sm">{user}</span>
                    <Button variant="ghost" size="sm" className="h-8 px-2">
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

