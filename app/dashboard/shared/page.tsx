"use client";

import { useEffect, useState } from "react";
import { NoteGrid } from "@/components/note-grid";
import api from "@/lib/api";
import { useProfile } from "@/components/providers/ProfileProvider";

/**
 * "Shared with Me" means boards the user can access (via list),
 * but doesn't own => board.owner_id !== user._id.
 */
export default function SharedWithMePage() {
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
        const res = await api.get("/boards/list");
        const allBoards = res.data;

        // user._id is the user ID from whoami. We want boards we do not own.
        const sharedBoards = allBoards.filter(
            (board: any) => board.owner_id !== user._id
        );

        const transformed = sharedBoards.map((board: any) => ({
          id: board._id,
          title: board.title || "Untitled",
          description: board.description || "",
          updatedAt: board.updated_at,
          collaborators: (board.shared_with?.length ?? 0) + 1,
          // We'll just say "Unknown Owner" unless we do a user lookup
          sharedBy: "Unknown Owner",
        }));

        if (isMounted) {
          setNotes(transformed);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Failed to load shared boards");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

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
          <h2 className="text-2xl font-bold tracking-tight">Shared with me</h2>
          <p className="text-muted-foreground">
            Notes and whiteboards that others have shared with you
          </p>
        </div>

        {loading && (
            <p className="text-sm text-muted-foreground">
              Loading boards shared with you...
            </p>
        )}

        {error && (
            <p className="text-sm text-red-500">
              Error loading shared boards: {error}
            </p>
        )}

        {!loading && !error && notes.length === 0 && (
            <p className="text-sm text-muted-foreground">No boards found.</p>
        )}

        {!loading && !error && notes.length > 0 && (
            <NoteGrid notes={notes} showSharedBy={true} />
        )}
      </div>
  );
}
