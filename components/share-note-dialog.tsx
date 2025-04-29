"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { Share2 } from "lucide-react";

/**
 * The board structure from the backend's GET /boards/{id}.
 * "shared_with" is an array of objects like { user_id: string, can_update: boolean }.
 */
interface BoardResponse {
  _id: string;
  owner_id: string;
  title: string;
  description?: string;
  shared_with: {
    user_id: string;    // The Mongo ObjectId of the user
    can_update: boolean;
  }[];
  // plus other fields: canvas_operations, created_at, updated_at, etc.
}

interface ShareNoteDialogProps {
  noteId: string; // This is the board's ObjectId
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ShareNoteDialog({ noteId, open, onOpenChange }: ShareNoteDialogProps) {
  const { toast } = useToast();

  // We can control the dialog's open state internally if no external props given
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = open !== undefined && onOpenChange !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled ? onOpenChange! : setInternalOpen;

  // Board data
  const [sharedWith, setSharedWith] = React.useState<BoardResponse["shared_with"]>([]);
  const [boardLoading, setBoardLoading] = React.useState(false);
  const [boardError, setBoardError] = React.useState<string | null>(null);

  // For sharing/removing a user
  const [username, setUsername] = React.useState("");
  const [canUpdate, setCanUpdate] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  /**
   * Fetch the board data once the dialog is opened,
   * so we can display its existing "shared_with" array.
   */
  React.useEffect(() => {
    if (!isOpen) return; // only fetch if dialog is actually open
    let cancel = false;

    (async () => {
      setBoardLoading(true);
      setBoardError(null);
      try {
        const res = await api.get<BoardResponse>(`/boards/${noteId}`);
        if (cancel) return;
        setSharedWith(res.data.shared_with);
      } catch (err: any) {
        if (cancel) return;
        const msg = err?.response?.data || err?.message || "Failed to load board data";
        setBoardError(msg);
      } finally {
        if (!cancel) setBoardLoading(false);
      }
    })();

    return () => {
      cancel = true;
    };
  }, [isOpen, noteId]);

  /**
   * Helper to re-fetch the board so that shared_with is up to date.
   */
  async function refetchBoard() {
    setBoardLoading(true);
    setBoardError(null);
    try {
      const res = await api.get<BoardResponse>(`/boards/${noteId}`);
      setSharedWith(res.data.shared_with);
    } catch (err: any) {
      const msg = err?.response?.data || err?.message || "Failed to refresh board data";
      setBoardError(msg);
    } finally {
      setBoardLoading(false);
    }
  }

  /**
   * Share (add user).
   * The backend expects a payload: { usernames: [string], action: "share", can_update: boolean }.
   * It will look up that user by username, then add them to the "shared_with".
   */
  async function handleShare() {
    if (!username.trim()) return;
    setIsSubmitting(true);

    try {
      await api.post(`/boards/${noteId}/share`, {
        usernames: [username.trim()],
        action: "share",
        can_update: canUpdate,
      });

      toast({
        title: "User shared",
        description: `Granted access to "${username.trim()}"`,
      });

      // Clear inputs
      setUsername("");
      setCanUpdate(false);

      // Refresh board data to see updated "shared_with"
      await refetchBoard();
    } catch (err: any) {
      const msg = err?.response?.data || err?.message || "Failed to share the board";
      toast({
        title: "Error",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  /**
   * Revoke (remove user).
   * The backend expects { usernames: [string], action: "revoke" }.
   */
  async function handleRevoke() {
    if (!username.trim()) return;
    setIsSubmitting(true);

    try {
      await api.post(`/boards/${noteId}/share`, {
        usernames: [username.trim()],
        action: "revoke",
      });

      toast({
        title: "User removed",
        description: `Revoked access for "${username.trim()}"`,
      });

      // Clear input
      setUsername("");
      setCanUpdate(false);

      // Refresh board data
      await refetchBoard();
    } catch (err: any) {
      const msg = err?.response?.data || err?.message || "Failed to remove the user";
      toast({
        title: "Error",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
            <DialogTitle>Share board</DialogTitle>
            <DialogDescription>
              Enter a username (the user must exist in the DB). You can grant or revoke access.
            </DialogDescription>
          </DialogHeader>

          {boardLoading && (
              <p className="text-sm text-muted-foreground">Loading board info...</p>
          )}
          {boardError && (
              <p className="text-sm text-red-500">
                Error loading board: {boardError}
              </p>
          )}

          {/* Only show form if not loading or error */}
          {!boardLoading && !boardError && (
              <>
                <div className="grid gap-3 py-4">
                  <div className="grid gap-1">
                    <Label htmlFor="username">Username</Label>
                    <Input
                        id="username"
                        type="text"
                        placeholder="e.g. alessioromeo2@gmail.com"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                        id="canUpdate"
                        checked={canUpdate}
                        onCheckedChange={(checked) => setCanUpdate(Boolean(checked))}
                    />
                    <Label htmlFor="canUpdate">Can update?</Label>
                  </div>
                  <div className="flex gap-2">
                    <Button
                        variant="default"
                        disabled={!username.trim() || isSubmitting}
                        onClick={handleShare}
                    >
                      {isSubmitting ? "Submitting..." : "Add user"}
                    </Button>
                    <Button
                        variant="outline"
                        disabled={!username.trim() || isSubmitting}
                        onClick={handleRevoke}
                    >
                      {isSubmitting ? "Submitting..." : "Remove user"}
                    </Button>
                  </div>
                </div>

                {/* CURRENT SHARED USERS */}
                {sharedWith.length > 0 && (
                    <div className="mt-2">
                      <Label className="mb-1">Currently shared with:</Label>
                      <div className="border rounded-md divide-y">
                        {sharedWith.map((entry) => (
                            <div
                                key={entry.user_id}
                                className="flex items-center justify-between p-2"
                            >
                              <div className="text-sm">
                                {/* user_id is the ObjectId of that user.
                            The board doc doesn't store username/email, just the ID. */}
                                <span className="font-medium">{entry.user_id}</span>{" "}
                                {entry.can_update && (
                                    <span className="ml-1 text-xs bg-gray-200 px-1 py-0.5 rounded">
                            can_update
                          </span>
                                )}
                              </div>
                            </div>
                        ))}
                      </div>
                    </div>
                )}
                {sharedWith.length === 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      This board is not shared with anyone else yet.
                    </p>
                )}
              </>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  );
}
