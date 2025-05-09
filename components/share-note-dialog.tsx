"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Copy, Check, X, Edit, Eye } from "lucide-react"
import api from "@/lib/api"
import type { Note, Collaborator } from "@/types"
import { Switch } from "@/components/ui/switch"

interface ShareNoteDialogProps {
    noteId: string
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ShareNoteDialog({ noteId, open, onOpenChange }: ShareNoteDialogProps) {
    const { toast } = useToast()
    const [email, setEmail] = useState("")
    const [canEdit, setCanEdit] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isRevoking, setIsRevoking] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const [note, setNote] = useState<Note | null>(null)
    const [isLoadingNote, setIsLoadingNote] = useState(false)

    // Fetch note data when dialog opens
    useEffect(() => {
        if (open && noteId) {
            const fetchNote = async () => {
                setIsLoadingNote(true)
                try {
                    const response = await api.get(`/boards/${noteId}`)
                    setNote(response.data)
                } catch (error) {
                    console.error("Failed to fetch note:", error)
                    toast({
                        title: "Failed to fetch note details",
                        description: "Could not load sharing information.",
                        duration: 3000,
                    })
                } finally {
                    setIsLoadingNote(false)
                }
            }

            fetchNote()
        }
    }, [noteId, open, toast])

    const shareableLink = `${window.location.origin}/shared/note/${noteId}`

    const copyLink = () => {
        navigator.clipboard.writeText(shareableLink)
        setCopied(true)
        toast({
            title: "Link copied",
            description: "The shareable link has been copied to your clipboard.",
            duration: 3000,
        })
        setTimeout(() => setCopied(false), 2000)
    }

    const handleShare = async () => {
        if (!email.trim()) return

        setIsLoading(true)
        try {
            await api.post(`/boards/${noteId}/share`, {
                emails: [email],
                action: "share",
                can_update: canEdit, // Use the selected permission level
            })

            toast({
                title: "Note shared",
                description: `The note has been shared with ${email} with ${canEdit ? "edit" : "view-only"} permissions.`,
                duration: 3000,
            })
            setEmail("")
            setCanEdit(false) // Reset to view-only for next share

            // Refresh note data to update shared_with list
            const response = await api.get(`/boards/${noteId}`)
            setNote(response.data)
        } catch (error) {
            console.error("Failed to share note:", error)
            toast({
                title: "Failed to share note",
                description: "Please check the email address and try again.",
                duration: 3000,
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleRevokeAccess = async (collaborator: Collaborator) => {
        const emailToRevoke = collaborator.user_email
        setIsRevoking(emailToRevoke)
        try {
            await api.post(`/boards/${noteId}/share`, {
                emails: [emailToRevoke],
                action: "revoke",
            })

            toast({
                title: "Access revoked",
                description: `Access has been revoked for ${emailToRevoke}.`,
                duration: 3000,
            })

            // Refresh note data to update shared_with list
            const response = await api.get(`/boards/${noteId}`)
            setNote(response.data)
        } catch (error) {
            console.error("Failed to revoke access:", error)
            toast({
                title: "Failed to revoke access",
                description: "An error occurred while revoking access.",
                duration: 3000,
            })
        } finally {
            setIsRevoking(null)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Share note</DialogTitle>
                    <DialogDescription>Share this note with others via email or by sending them the link.</DialogDescription>
                </DialogHeader>

                <div className="flex items-center space-x-2 mt-4">
                    <div className="grid flex-1 gap-2">
                        <Label htmlFor="link" className="sr-only">
                            Link
                        </Label>
                        <Input id="link" defaultValue={shareableLink} readOnly className="w-full" />
                    </div>
                    <Button type="button" size="icon" onClick={copyLink} className="px-3">
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        <span className="sr-only">Copy link</span>
                    </Button>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <div className="grid flex-1 gap-2">
                            <Label htmlFor="email" className="sr-only">
                                Email
                            </Label>
                            <Input
                                id="email"
                                placeholder="Enter an email address"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <Button type="button" onClick={handleShare} disabled={isLoading || !email.trim()} className="px-3">
                            {isLoading ? "Sharing..." : "Share"}
                        </Button>
                    </div>

                    {/* Permission toggle */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Label htmlFor="can-edit" className="text-sm font-medium">
                                {canEdit ? (
                                    <span className="flex items-center">
                    <Edit className="mr-1 h-4 w-4" /> Can edit
                  </span>
                                ) : (
                                    <span className="flex items-center">
                    <Eye className="mr-1 h-4 w-4" /> Can view
                  </span>
                                )}
                            </Label>
                            <span className="text-xs text-muted-foreground">
                {canEdit ? "User can make changes to this note" : "User can only view this note"}
              </span>
                        </div>
                        <Switch id="can-edit" checked={canEdit} onCheckedChange={setCanEdit} />
                    </div>
                </div>

                {/* Display shared_with collaborators with revoke button */}
                {note && note.shared_with && note.shared_with.length > 0 && (
                    <div className="mt-4">
                        <h4 className="text-sm font-medium mb-2">Shared with:</h4>
                        <div className="max-h-40 overflow-y-auto">
                            <ul className="space-y-1">
                                {note.shared_with.map((collaborator, index) => (
                                    <li key={index} className="text-sm px-3 py-1.5 bg-muted rounded-md flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span>{collaborator.user_email}</span>
                                            <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                        {collaborator.can_update ? (
                            <>
                                <Edit className="mr-1 h-3 w-3" /> Editor
                            </>
                        ) : (
                            <>
                                <Eye className="mr-1 h-3 w-3" /> Viewer
                            </>
                        )}
                      </span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 rounded-full hover:bg-destructive/10 hover:text-destructive"
                                            onClick={() => handleRevokeAccess(collaborator)}
                                            disabled={isRevoking === collaborator.user_email}
                                        >
                                            {isRevoking === collaborator.user_email ? (
                                                <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                            ) : (
                                                <X className="h-3 w-3" />
                                            )}
                                            <span className="sr-only">Revoke access</span>
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                {isLoadingNote && (
                    <div className="text-center py-2">
                        <p className="text-sm text-muted-foreground">Loading sharing information...</p>
                    </div>
                )}

                <DialogFooter className="sm:justify-start">
                    <DialogDescription className="text-xs text-muted-foreground">
                        Anyone with the link or added via email will be able to view this note.
                    </DialogDescription>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
