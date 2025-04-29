"use client";

import { useEffect, useState } from "react";
import { NoteGrid } from "@/components/note-grid";
import api from "@/lib/api";
import { useProfile } from "@/components/providers/ProfileProvider";

/**
 * Dashboard: "Your Notes" means boards where board.owner_id === user._id.
 */
export default function Dashboard() {
  const { user } = useProfile();
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchBoards() {
      setLoading(true);
      setError(null);

      try {
        // GET /api/boards/list
        const res = await api.get("/boards/list");
        const allBoards = res.data; // array of boards

        // user._id is the user ID from whoami. Compare to board.owner_id.
        const myBoards = allBoards.filter(
            (board: any) => board.owner_id === user._id
        );

        // Transform boards for NoteGrid
        // The grid expects { id, title, description, updatedAt, collaborators, ... }
        const transformed = myBoards.map((board: any) => ({
          id: board._id, // Use the board's _id as the unique ID
          title: board.title || "Untitled",
          description: board.description || "",
          updatedAt: board.updated_at,
          // collaborators = shared_with.length + 1 (owner + shared users)
          collaborators: (board.shared_with?.length ?? 0) + 1,
        }));

        if (isMounted) {
          setNotes(transformed);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Failed to load boards");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    // Only fetch if we have the user’s ID loaded
    if (user && user._id) {
      fetchBoards();
    }
    return () => {
      isMounted = false;
    };
  }, [user]);

  return (
      <div className="space-y-6 w-full h-full">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Your Notes</h2>
          <p className="text-muted-foreground">
            Create, manage, and collaborate on your notes
          </p>
        </div>

        {loading && (
            <p className="text-sm text-muted-foreground">Loading your boards...</p>
        )}

        {error && (
            <p className="text-sm text-red-500">Error loading boards: {error}</p>
        )}

        {!loading && !error && notes.length === 0 && (
            <p className="text-sm text-muted-foreground">No boards found.</p>
        )}

        {!loading && !error && notes.length > 0 && (
            <NoteGrid notes={notes} />
        )}
      </div>
  );
}
