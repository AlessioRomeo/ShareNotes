"use client"

import { useEffect, useState, useRef } from "react"
import { useParams } from "next/navigation"
import { Whiteboard } from "@/components/whiteboard"
import { ShareNoteDialog } from "@/components/share-note-dialog"
import { Button } from "@/components/ui/button"
import { BrainCircuit, Loader2, Users } from "lucide-react"
import { QuizModal, type QuizQuestion } from "@/components/quiz-modal"
import api from "@/lib/api"
import type { CanvasOperation } from "@/types/canvas"
import { useToast } from "@/hooks/use-toast"
import { useProfile } from "@/components/providers/ProfileProvider"

interface BoardData {
    id: string
    title: string
    description: string
    owner_email: string
    canvas_operations: CanvasOperation[]
    shared_with: any[]
    created_at: string
    updated_at: string
}

// User type for active users
interface ActiveUser {
    id: string
    email: string
    cursor?: { x: number; y: number }
}

// Updated WebSocketMessage interface with proper types for all message types
interface WebSocketMessage {
    type: string
    operation?: CanvasOperation
    operations?: CanvasOperation[]
    user?: ActiveUser
    users?: ActiveUser[] // Added users array for active_users message type
}

export default function NotePage() {
    const params = useParams()
    const id = params.id as string
    const { toast } = useToast()
    const { user } = useProfile()

    const [isLoading, setIsLoading] = useState(true)
    const [isQuizOpen, setIsQuizOpen] = useState(false)
    const [isShareOpen, setIsShareOpen] = useState(false)
    const [boardData, setBoardData] = useState<BoardData | null>(null)
    const [operations, setOperations] = useState<CanvasOperation[]>([])
    const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([])

    const socketRef = useRef<WebSocket | null>(null)
    const isConnectedRef = useRef(false)
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Fetch initial board data and canvas operations
    useEffect(() => {
        if (!id) return

        const fetchBoard = async () => {
            setIsLoading(true)
            try {
                const response = await api.get(`/boards/${id}`)
                const data = response.data
                setBoardData(data)

                // Initialize operations from the board data
                if (data.canvas_operations && Array.isArray(data.canvas_operations)) {
                    setOperations(data.canvas_operations)
                }
            } catch (error) {
                console.error("Error fetching board:", error)
                toast({
                    title: "Error",
                    description: "Failed to load the whiteboard. Please try again.",
                    variant: "destructive",
                })
            } finally {
                setIsLoading(false)
            }
        }

        fetchBoard()
    }, [id, toast])

    // Set up WebSocket connection
    useEffect(() => {
        if (!id || !user?.email || isConnectedRef.current) return

        const connectWebSocket = () => {
            // Create WebSocket connection
            const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
            const wsUrl = `${protocol}//${window.location.host}/api/boards/${id}/ws?userId=${user.id}&email=${encodeURIComponent(user.email)}`

            const socket = new WebSocket(wsUrl)
            socketRef.current = socket

            socket.onopen = () => {
                console.log("WebSocket connection established")
                isConnectedRef.current = true

                // Clear any reconnect timeout
                if (reconnectTimeoutRef.current) {
                    clearTimeout(reconnectTimeoutRef.current)
                    reconnectTimeoutRef.current = null
                }

                // Request initial sync
                socket.send(JSON.stringify({ type: "sync_request" }))
            }

            socket.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data) as WebSocketMessage

                    switch (message.type) {
                        case "operation":
                            if (message.operation) {
                                // Add new operation to the list
                                setOperations((prevOperations) => [...prevOperations, message.operation!])
                            }
                            break
                        case "sync":
                            if (message.operations) {
                                // Replace all operations with the synced state
                                setOperations(message.operations)
                            }
                            break
                        case "user_joined":
                            if (message.user) {
                                setActiveUsers((prev) => {
                                    // Add user if not already in the list
                                    if (!prev.some((u) => u.id === message.user!.id)) {
                                        return [...prev, message.user!]
                                    }
                                    return prev
                                })

                                toast({
                                    title: "User joined",
                                    description: `${message.user.email} joined the whiteboard`,
                                })
                            }
                            break
                        case "user_left":
                            if (message.user) {
                                setActiveUsers((prev) => prev.filter((u) => u.id !== message.user!.id))

                                toast({
                                    title: "User left",
                                    description: `${message.user.email} left the whiteboard`,
                                })
                            }
                            break
                        case "active_users":
                            if (message.users && Array.isArray(message.users)) {
                                setActiveUsers(message.users)
                            }
                            break
                        case "cursor_update":
                            if (message.user && message.user.cursor) {
                                setActiveUsers((prev) =>
                                    prev.map((u) => (u.id === message.user!.id ? { ...u, cursor: message.user!.cursor } : u)),
                                )
                            }
                            break
                    }
                } catch (error) {
                    console.error("Error processing WebSocket message:", error)
                }
            }

            socket.onerror = (error) => {
                console.error("WebSocket error:", error)
            }

            socket.onclose = (event) => {
                console.log("WebSocket connection closed", event.code, event.reason)
                isConnectedRef.current = false

                // Attempt to reconnect after a delay, unless it was a normal closure
                if (event.code !== 1000) {
                    reconnectTimeoutRef.current = setTimeout(() => {
                        connectWebSocket()
                    }, 3000)
                }
            }
        }

        connectWebSocket()

        // Clean up WebSocket connection on unmount
        return () => {
            if (socketRef.current) {
                socketRef.current.close(1000, "Component unmounted")
            }

            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current)
            }

            isConnectedRef.current = false
        }
    }, [id, user, toast])

    // Function to add a new operation
    const handleOperation = (operation: CanvasOperation) => {
        // Send operation to server via WebSocket
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(
                JSON.stringify({
                    type: "operation",
                    operation,
                }),
            )
        } else {
            // Fallback to API if WebSocket is not available
            api
                .post(`/boards/${id}/operations`, { operation })
                .then(() => {
                    // Add operation to local state
                    setOperations((prevOperations) => [...prevOperations, operation])
                })
                .catch((error) => {
                    console.error("Error sending operation:", error)
                    toast({
                        title: "Error",
                        description: "Failed to save your changes. Please try again.",
                        variant: "destructive",
                    })
                })
        }
    }

    // Sample quiz data
    const sampleQuiz: QuizQuestion[] = [
        {
            id: "q1",
            question: "What is the primary goal of a project kickoff meeting?",
            options: [
                { id: "q1a", text: "To assign blame for previous project failures", isCorrect: false },
                { id: "q1b", text: "To establish project objectives and team roles", isCorrect: true },
                { id: "q1c", text: "To determine the project budget only", isCorrect: false },
                { id: "q1d", text: "To schedule future meetings", isCorrect: false },
            ],
            explanation:
                "A project kickoff meeting primarily serves to align the team on objectives, clarify roles and responsibilities, and establish communication protocols for the project.",
        },
        // ... other quiz questions
    ]

    // Show loading spinner while data is being fetched
    if (isLoading) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="sr-only">Loading</span>
            </div>
        )
    }

    const note = boardData || {
        id,
        title: "Untitled Note",
        description: "Collaborative whiteboard for brainstorming and planning.",
    }

    return (
        <div className="h-full w-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-2xl font-bold">{note.title}</h1>
                    <p className="text-muted-foreground">{note.description}</p>
                </div>
                <div className="flex gap-2">
                    {activeUsers.length > 0 && (
                        <Button variant="outline" size="sm" className="gap-2">
                            <Users className="h-4 w-4" />
                            {activeUsers.length} active
                        </Button>
                    )}
                    <Button variant="outline" onClick={() => setIsQuizOpen(true)} className="gap-2">
                        <BrainCircuit className="h-4 w-4" />
                        Generate Quiz
                    </Button>
                    <Button variant="outline" onClick={() => setIsShareOpen(true)}>
                        Share
                    </Button>
                </div>
            </div>
            <div className="flex-1 border rounded-lg overflow-hidden w-full">
                <Whiteboard operations={operations} onOperation={handleOperation} readOnly={false} userId={user?.id} />
            </div>

            {isShareOpen && <ShareNoteDialog noteId={id} open={isShareOpen} onOpenChange={setIsShareOpen} />}

            <QuizModal
                open={isQuizOpen}
                onOpenChange={setIsQuizOpen}
                title={`Quiz on ${note.title}`}
                questions={sampleQuiz}
            />
        </div>
    )
}
