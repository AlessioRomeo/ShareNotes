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
import { toPng } from "html-to-image"
import type { Question } from "@/types/quiz"

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
]

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

interface ActiveUser {
    id: string
    email: string
    cursor?: { x: number; y: number }
}

interface WebSocketMessage {
    type: string
    operation?: CanvasOperation
    operations?: CanvasOperation[]
    user?: ActiveUser
    users?: ActiveUser[]
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
    const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([])
    const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false)
    const whiteboardRef = useRef<HTMLDivElement>(null)

    const socketRef = useRef<WebSocket | null>(null)
    const isConnectedRef = useRef(false)
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        if (!id) return

        const fetchBoard = async () => {
            setIsLoading(true)
            try {
                const { data } = await api.get<BoardData>(`/boards/${id}`)
                setBoardData(data)
                if (Array.isArray(data.canvas_operations)) {
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

    useEffect(() => {
        if (!id || !user?.email || isConnectedRef.current) return

        const connectWebSocket = () => {
            const userId = (user as any)._id ?? (user as any).id ?? "anonymous"
            const token = localStorage.getItem("token") ?? ""
            const backendHost = process.env.NEXT_PUBLIC_BACKEND_WS ?? "ws://127.0.0.1:8080"

            const wsUrl =
                `${backendHost}/ws/boards/${encodeURIComponent(id)}` +
                `?token=${encodeURIComponent(token)}` +
                `&userId=${encodeURIComponent(userId)}` +
                `&email=${encodeURIComponent(user.email)}`

            const socket = new WebSocket(wsUrl)
            socketRef.current = socket

            socket.onopen = () => {
                console.log("WebSocket connection established")
                isConnectedRef.current = true
                if (reconnectTimeoutRef.current) {
                    clearTimeout(reconnectTimeoutRef.current)
                    reconnectTimeoutRef.current = null
                }
                socket.send(JSON.stringify({ type: "sync_request" }))
            }

            socket.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data) as WebSocketMessage
                    switch (message.type) {
                        case "operation":
                            if (message.operation) {
                                setOperations((ops) => [...ops, message.operation!])
                            }
                            break
                        case "sync":
                            if (message.operations) {
                                setOperations(message.operations)
                            }
                            break
                        case "user_joined":
                            if (message.user) {
                                setActiveUsers((prev) =>
                                    prev.some((u) => u.id === message.user!.id) ? prev : [...prev, message.user!],
                                )
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
                            if (Array.isArray(message.users)) {
                                setActiveUsers(message.users)
                            }
                            break
                        case "cursor_update":
                            if (message.user?.cursor) {
                                setActiveUsers((prev) =>
                                    prev.map((u) => (u.id === message.user!.id ? { ...u, cursor: message.user!.cursor } : u)),
                                )
                            }
                            break
                    }
                } catch (err) {
                    console.error("Error processing WS message:", err)
                }
            }

            socket.onerror = (err) => {
                console.error(`WebSocket error: ${err}`)
            }

            socket.onclose = (event) => {
                console.log("WebSocket closed", event.code, event.reason)
                isConnectedRef.current = false
                if (event.code !== 1000) {
                    reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000)
                }
            }
        }

        connectWebSocket()

        return () => {
            socketRef.current?.close(1000, "Component unmounted")
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current)
            }
            isConnectedRef.current = false
        }
    }, [id, user, toast])

    const handleOperation = (operation: CanvasOperation) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({ type: "operation", operation }))
        } else {
            api
                .post(`/boards/${id}/operations`, { operation })
                .then(() => setOperations((prev) => [...prev, operation]))
                .catch((err) => {
                    console.error("Error sending op:", err)
                    toast({
                        title: "Error",
                        description: "Failed to save your changes. Please try again.",
                        variant: "destructive",
                    })
                })
        }
    }

    const handleGenerateQuiz = async () => {
        if (!whiteboardRef.current) return

        setIsGeneratingQuiz(true)
        try {
            // Capture the whiteboard as an image
            const dataUrl = await toPng(whiteboardRef.current)
            // Convert data URL to base64 string (remove the prefix)
            const base64Image = dataUrl.split(",")[1]

            // Send to backend
            const { data } = await api.post(`/quizzes/create`, {
                title: note.title,
                description: note.description,
                image_data: base64Image,
                reference_board: id,
            })

            // Convert backend questions to frontend format
            const formattedQuestions: QuizQuestion[] = data.questions.map((q: Question, index: number) => {
                // Map A, B, C, D to index 0, 1, 2, 3
                const correctIndex = q.correct_answer.charCodeAt(0) - 65

                return {
                    id: `q${index + 1}`,
                    question: q.prompt,
                    options: q.options.map((text, i) => ({
                        id: `q${index + 1}${String.fromCharCode(97 + i)}`,
                        text,
                        isCorrect: i === correctIndex,
                    })),
                }
            })

            setQuizQuestions(formattedQuestions)
            setIsQuizOpen(true)
        } catch (error) {
            console.error("Error generating quiz:", error)
            toast({
                title: "Error",
                description: `Failed to generate quiz. ${(error as Error).message}`,
                variant: "destructive",
            })
        } finally {
            setIsGeneratingQuiz(false)
        }
    }

    if (isLoading) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="sr-only">Loading</span>
            </div>
        )
    }

    const note = boardData ?? {
        id,
        title: "Untitled Note",
        description: "Collaborative whiteboard for brainstorming and planning.",
    }

    return (
        <div className="h-full w-full flex flex-col">
            {/* header/buttons */}
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
                    <Button variant="outline" onClick={handleGenerateQuiz} disabled={isGeneratingQuiz} className="gap-2">
                        <BrainCircuit className="h-4 w-4" />
                        {isGeneratingQuiz ? "Generating..." : "Generate Quiz"}
                    </Button>
                    <Button variant="outline" onClick={() => setIsShareOpen(true)}>
                        Share
                    </Button>
                </div>
            </div>

            {/* whiteboard */}
            <div className="flex-1 border rounded-lg overflow-hidden w-full" ref={whiteboardRef}>
                <Whiteboard operations={operations} onOperation={handleOperation} readOnly={false} userId={user?.id} />
            </div>

            {isShareOpen && <ShareNoteDialog noteId={id} open={isShareOpen} onOpenChange={setIsShareOpen} />}

            <QuizModal
                open={isQuizOpen}
                onOpenChange={setIsQuizOpen}
                title={`Quiz on ${note.title}`}
                questions={quizQuestions.length > 0 ? quizQuestions : sampleQuiz}
                boardId={id}
            />
        </div>
    )
}
