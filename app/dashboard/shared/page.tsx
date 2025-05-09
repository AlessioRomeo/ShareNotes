"use client"

import { useCallback, useEffect, useState } from "react"
import { NoteGrid } from "@/components/note-grid"
import api from "@/lib/api"
import { useProfile } from "@/components/providers/ProfileProvider"
import { useToast } from "@/hooks/use-toast"
import type { Note } from "@/types"
import { Loader2 } from "lucide-react"

/**
 * "Shared with Me" means boards the user can access (via list),
 * but doesn't own => board.owner_email !== user.email.
 */
export default function SharedWithMePage() {
    const { user } = useProfile()
    const { toast } = useToast()
    const [notes, setNotes] = useState<Note[]>([])
    const [loading, setLoading] = useState<boolean>(true)

    const fetchBoards = useCallback(async () => {
        if (!user || !user.email) return

        setLoading(true)

        try {
            const res = await api.get("/boards/list")
            const allBoards = res.data

            // Filter boards where the user is not the owner
            const sharedBoards = allBoards.filter((board: any) => board.owner_email !== user.email)

            // Transform the data to match the Note type
            const transformedNotes: Note[] = sharedBoards.map((board: any) => ({
                id: board.id,
                title: board.title || "Untitled",
                description: board.description || "",
                content: board.content || "",
                ownerId: board.owner_email || "Unknown",
                created_at: board.created_at,
                updated_at: board.updated_at,
                shared_with: board.shared_with || [],
            }))

            setNotes(transformedNotes)
        } catch (err) {
            console.error("Failed to load shared boards:", err)
            toast({
                title: "Failed to load shared boards",
                description: (err as Error).message,
                duration: 3000,
            })
        } finally {
            setLoading(false)
        }
    }, [user, toast])

    useEffect(() => {
        if (user && user.email) {
            fetchBoards()
        }
    }, [user, fetchBoards])

    return (
        <div className="space-y-6 w-full h-full">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Shared with me</h2>
                <p className="text-muted-foreground">Notes and whiteboards that others have shared with you</p>
            </div>

            {loading && (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="sr-only">Loading shared boards...</span>
                </div>
            )}

            {!loading && notes.length === 0 && (
                <div className="text-center py-8">
                    <p className="text-muted-foreground">No shared boards found.</p>
                    <p className="text-sm text-muted-foreground mt-1">
                        When someone shares a board with you, it will appear here.
                    </p>
                </div>
            )}

            {!loading && notes.length > 0 && (
                <NoteGrid notes={notes} showSharedBy={true} onDelete={() => void fetchBoards()} />
            )}
        </div>
    )
}
