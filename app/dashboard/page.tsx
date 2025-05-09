"use client"
import  {NoteGrid} from "@/components/note-grid"
import React, {useCallback, useEffect, useState} from "react";
import api from "@/lib/api";
import {Note} from "@/types";
import {useToast} from "@/hooks/use-toast";

export default function Page() {
    const [notes, setNotes] = useState<Note[]>([])
    const { toast } = useToast()

    const fetchNotes = useCallback(async () => {
        try {
            const { data } = await api.get<Note[]>("/boards/list")
            setNotes(data)
        } catch (err) {
            console.error(err)
            toast({
                title: "Failed to load notes",
                description: (err as Error).message,
            })
        }
    }, [toast])

    useEffect(() => {
        fetchNotes()
    }, [fetchNotes])
  return (
    <div className="space-y-6 w-full h-full">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Your Notes</h2>
        <p className="text-muted-foreground">Create, manage, and collaborate on your notes</p>
      </div>
      <NoteGrid notes={notes} onDelete={() => void fetchNotes()} />
    </div>
  )
}

