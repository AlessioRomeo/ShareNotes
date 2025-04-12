"use client"

import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Pencil, Share2, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { ShareNoteDialog } from "@/components/share-note-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"

interface Note {
  id: string
  title: string
  description: string
  updatedAt: string
  collaborators: number
  sharedBy?: string
}

interface NoteGridProps {
  notes: Note[]
  showSharedBy?: boolean
}

export function NoteGrid({ notes, showSharedBy = false }: NoteGridProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [noteToShare, setNoteToShare] = useState<string | null>(null)
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null)

  const handleDeleteNote = () => {
    if (!noteToDelete) return

    // In a real app, you would call an API to delete the note
    // For this demo, we'll just show a success toast
    toast({
      title: "Note deleted",
      description: "The note has been successfully deleted.",
      duration: 3000,
    })

    setNoteToDelete(null)
  }

  const handleCardClick = (noteId: string) => {
    router.push(`/dashboard/note/${noteId}`)
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {notes.map((note) => (
          <Card
            key={note.id}
            className="h-full transition-all hover:shadow-md cursor-pointer"
            onClick={() => handleCardClick(note.id)}
          >
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">{note.title}</CardTitle>
              <div onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => router.push(`/dashboard/note/${note.id}`)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      <span>Edit</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setNoteToShare(note.id)}>
                      <Share2 className="mr-2 h-4 w-4" />
                      <span>Share</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setNoteToDelete(note.id)}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2">{note.description}</p>
              {showSharedBy && note.sharedBy && <p className="text-sm mt-2 font-medium">Shared by: {note.sharedBy}</p>}
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-xs text-muted-foreground">
                Updated {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
              </div>
              <div className="flex -space-x-2">
                {Array.from({ length: Math.min(note.collaborators, 3) }).map((_, i) => (
                  <Avatar key={i} className="h-6 w-6 border-2 border-background">
                    <AvatarFallback className="text-xs">{String.fromCharCode(65 + i)}</AvatarFallback>
                  </Avatar>
                ))}
                {note.collaborators > 3 && (
                  <Avatar className="h-6 w-6 border-2 border-background">
                    <AvatarFallback className="text-xs bg-muted">+{note.collaborators - 3}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Share Dialog */}
      {noteToShare && (
        <ShareNoteDialog noteId={noteToShare} open={!!noteToShare} onOpenChange={() => setNoteToShare(null)} />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!noteToDelete} onOpenChange={(open) => !open && setNoteToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the note and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteNote}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

