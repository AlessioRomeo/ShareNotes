"use client"

import type React from "react"

import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Pencil, Square, Circle, Type, Trash2, Undo, Redo, Move, ArrowRight, Eraser } from "lucide-react"
import { type CanvasOperation, OperationType } from "@/types/canvas"
import {
    createDrawOperation,
    createEraseOperation,
    createRectangleOperation,
    createCircleOperation,
    createLineOperation,
    createArrowOperation,
    createTextOperation,
    createClearOperation,
} from "@/utils/canvas-operations"
import { renderOperations } from "@/utils/canvas-renderer"

interface WhiteboardProps {
    operations?: CanvasOperation[]
    onOperation?: (operation: CanvasOperation) => void
    readOnly?: boolean
    userId?: string
}

export function Whiteboard({ operations = [], onOperation, readOnly = false, userId = "anonymous" }: WhiteboardProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const textInputRef = useRef<HTMLInputElement>(null)
    const [tool, setTool] = useState<OperationType>(OperationType.DRAW)
    const [color, setColor] = useState<string>("#000000")
    const [lineWidth, setLineWidth] = useState<number>(2)
    const [isDrawing, setIsDrawing] = useState<boolean>(false)
    const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null)
    const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([])
    const [localOperations, setLocalOperations] = useState<CanvasOperation[]>([])
    const [redoStack, setRedoStack] = useState<CanvasOperation[]>([])
    const [textPosition, setTextPosition] = useState<{ x: number; y: number } | null>(null)

    // Combine remote and local operations
    const allOperations = [...operations, ...localOperations]

    // Initialize canvas and apply operations
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        // Set canvas size to match parent container
        const resizeCanvas = () => {
            const parent = canvas.parentElement
            if (parent) {
                canvas.width = parent.clientWidth
                canvas.height = parent.clientHeight
            }
        }

        resizeCanvas()
        window.addEventListener("resize", resizeCanvas)

        // Render all operations
        renderOperations(ctx, allOperations)

        return () => {
            window.removeEventListener("resize", resizeCanvas)
        }
    }, [operations, localOperations])

    // Handle mouse down event
    const handleMouseDown = useCallback(
        (e: React.MouseEvent<HTMLCanvasElement>) => {
            if (readOnly) return

            const canvas = canvasRef.current
            if (!canvas) return

            const rect = canvas.getBoundingClientRect()
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top

            setIsDrawing(true)
            setStartPoint({ x, y })

            if (tool === OperationType.DRAW || tool === OperationType.ERASE) {
                setCurrentPoints([{ x, y }])
            } else if (tool === OperationType.TEXT) {
                setTextPosition({ x, y })
                // Focus the text input
                if (textInputRef.current) {
                    textInputRef.current.style.left = `${x}px`
                    textInputRef.current.style.top = `${y}px`
                    textInputRef.current.style.display = "block"
                    textInputRef.current.focus()
                }
            }
        },
        [readOnly, tool],
    )

    // Handle mouse move event
    const handleMouseMove = useCallback(
        (e: React.MouseEvent<HTMLCanvasElement>) => {
            if (readOnly || !isDrawing || !startPoint) return

            const canvas = canvasRef.current
            if (!canvas) return

            const rect = canvas.getBoundingClientRect()
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top

            if (tool === OperationType.DRAW || tool === OperationType.ERASE) {
                // Update points for path-based operations
                setCurrentPoints((prev) => [...prev, { x, y }])

                // Draw on canvas in real-time
                const ctx = canvas.getContext("2d")
                if (ctx) {
                    // Save current state
                    ctx.save()

                    if (tool === OperationType.ERASE) {
                        ctx.globalCompositeOperation = "destination-out"
                    }

                    ctx.beginPath()
                    ctx.moveTo(startPoint.x, startPoint.y)
                    ctx.lineTo(x, y)
                    ctx.strokeStyle = tool === OperationType.ERASE ? "#000000" : color
                    ctx.lineWidth = tool === OperationType.ERASE ? 20 : lineWidth
                    ctx.lineCap = "round"
                    ctx.lineJoin = "round"
                    ctx.stroke()

                    // Restore state
                    ctx.restore()

                    // Update start point for next segment
                    setStartPoint({ x, y })
                }
            } else {
                // For shape operations, redraw the canvas and preview the shape
                const ctx = canvas.getContext("2d")
                if (ctx) {
                    // Redraw all operations
                    renderOperations(ctx, allOperations)

                    // Draw preview shape
                    ctx.save()
                    ctx.strokeStyle = color
                    ctx.lineWidth = lineWidth

                    switch (tool) {
                        case OperationType.RECTANGLE:
                            ctx.beginPath()
                            ctx.rect(startPoint.x, startPoint.y, x - startPoint.x, y - startPoint.y)
                            ctx.stroke()
                            break
                        case OperationType.CIRCLE:
                            const radius = Math.sqrt(Math.pow(x - startPoint.x, 2) + Math.pow(y - startPoint.y, 2))
                            ctx.beginPath()
                            ctx.arc(startPoint.x, startPoint.y, radius, 0, Math.PI * 2)
                            ctx.stroke()
                            break
                        case OperationType.LINE:
                            ctx.beginPath()
                            ctx.moveTo(startPoint.x, startPoint.y)
                            ctx.lineTo(x, y)
                            ctx.stroke()
                            break
                        case OperationType.ARROW:
                            // Draw line
                            ctx.beginPath()
                            ctx.moveTo(startPoint.x, startPoint.y)
                            ctx.lineTo(x, y)
                            ctx.stroke()

                            // Draw arrow head
                            const angle = Math.atan2(y - startPoint.y, x - startPoint.x)
                            const headLength = 10 + lineWidth
                            ctx.beginPath()
                            ctx.moveTo(x, y)
                            ctx.lineTo(x - headLength * Math.cos(angle - Math.PI / 6), y - headLength * Math.sin(angle - Math.PI / 6))
                            ctx.lineTo(x - headLength * Math.cos(angle + Math.PI / 6), y - headLength * Math.sin(angle + Math.PI / 6))
                            ctx.closePath()
                            ctx.fillStyle = color
                            ctx.fill()
                            break
                    }

                    ctx.restore()
                }
            }
        },
        [readOnly, isDrawing, startPoint, tool, color, lineWidth, allOperations],
    )

    // Handle mouse up event
    const handleMouseUp = useCallback(
        (e: React.MouseEvent<HTMLCanvasElement>) => {
            if (readOnly || !isDrawing || !startPoint) return

            const canvas = canvasRef.current
            if (!canvas) return

            const rect = canvas.getBoundingClientRect()
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top

            let operation: CanvasOperation | null = null

            switch (tool) {
                case OperationType.DRAW:
                    if (currentPoints.length > 1) {
                        operation = createDrawOperation(currentPoints, color, lineWidth, userId)
                    }
                    break
                case OperationType.ERASE:
                    if (currentPoints.length > 1) {
                        operation = createEraseOperation(
                            currentPoints,
                            lineWidth * 10, // Eraser is usually thicker
                            userId,
                        )
                    }
                    break
                case OperationType.RECTANGLE:
                    operation = createRectangleOperation(
                        startPoint.x,
                        startPoint.y,
                        x - startPoint.x,
                        y - startPoint.y,
                        color,
                        lineWidth,
                        undefined, // No fill color
                        userId,
                    )
                    break
                case OperationType.CIRCLE:
                    const radius = Math.sqrt(Math.pow(x - startPoint.x, 2) + Math.pow(y - startPoint.y, 2))
                    operation = createCircleOperation(
                        startPoint.x,
                        startPoint.y,
                        radius,
                        color,
                        lineWidth,
                        undefined, // No fill color
                        userId,
                    )
                    break
                case OperationType.LINE:
                    operation = createLineOperation(startPoint.x, startPoint.y, x, y, color, lineWidth, userId)
                    break
                case OperationType.ARROW:
                    operation = createArrowOperation(startPoint.x, startPoint.y, x, y, color, lineWidth, userId)
                    break
            }

            if (operation) {
                // Add to local operations
                setLocalOperations((prev) => [...prev, operation!])

                // Clear redo stack
                setRedoStack([])

                // Send to parent component
                if (onOperation) {
                    onOperation(operation)
                }
            }

            // Reset state
            setIsDrawing(false)
            setStartPoint(null)
            setCurrentPoints([])
        },
        [readOnly, isDrawing, startPoint, tool, color, lineWidth, currentPoints, userId, onOperation],
    )

    // Handle text input
    const handleTextSubmit = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter" && textPosition) {
                const text = e.currentTarget.value.trim()
                if (text) {
                    const operation = createTextOperation(
                        textPosition.x,
                        textPosition.y,
                        text,
                        16, // fontSize
                        "Arial", // fontFamily
                        color,
                        userId,
                    )

                    // Add to local operations
                    setLocalOperations((prev) => [...prev, operation])

                    // Clear redo stack
                    setRedoStack([])

                    // Send to parent component
                    if (onOperation) {
                        onOperation(operation)
                    }
                }

                // Reset text input
                e.currentTarget.value = ""
                e.currentTarget.style.display = "none"
                setTextPosition(null)
            }
        },
        [textPosition, color, userId, onOperation],
    )

    // Handle undo
    const handleUndo = useCallback(() => {
        if (localOperations.length === 0) return

        const newLocalOps = [...localOperations]
        const removedOp = newLocalOps.pop()

        if (removedOp) {
            setLocalOperations(newLocalOps)
            setRedoStack((prev) => [...prev, removedOp])
        }
    }, [localOperations])

    // Handle redo
    const handleRedo = useCallback(() => {
        if (redoStack.length === 0) return

        const newRedoStack = [...redoStack]
        const restoredOp = newRedoStack.pop()

        if (restoredOp) {
            setRedoStack(newRedoStack)
            setLocalOperations((prev) => [...prev, restoredOp])

            // Send the restored operation to the parent component
            if (onOperation) {
                onOperation(restoredOp)
            }
        }
    }, [redoStack, onOperation])

    // Handle clear
    const handleClear = useCallback(() => {
        if (readOnly) return

        const clearOp = createClearOperation(userId)

        // Add to local operations
        setLocalOperations([clearOp])

        // Clear redo stack
        setRedoStack([])

        // Send to parent component
        if (onOperation) {
            onOperation(clearOp)
        }
    }, [readOnly, userId, onOperation])

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-2 border-b bg-background">
                <div className="flex space-x-1 overflow-x-auto pb-1">
                    <Button
                        variant={tool === OperationType.DRAW ? "default" : "outline"}
                        size="icon"
                        onClick={() => setTool(OperationType.DRAW)}
                        disabled={readOnly}
                        title="Pencil"
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={tool === OperationType.ERASE ? "default" : "outline"}
                        size="icon"
                        onClick={() => setTool(OperationType.ERASE)}
                        disabled={readOnly}
                        title="Eraser"
                    >
                        <Eraser className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={tool === OperationType.RECTANGLE ? "default" : "outline"}
                        size="icon"
                        onClick={() => setTool(OperationType.RECTANGLE)}
                        disabled={readOnly}
                        title="Rectangle"
                    >
                        <Square className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={tool === OperationType.CIRCLE ? "default" : "outline"}
                        size="icon"
                        onClick={() => setTool(OperationType.CIRCLE)}
                        disabled={readOnly}
                        title="Circle"
                    >
                        <Circle className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={tool === OperationType.LINE ? "default" : "outline"}
                        size="icon"
                        onClick={() => setTool(OperationType.LINE)}
                        disabled={readOnly}
                        title="Line"
                    >
                        <div className="h-4 w-4 flex items-center justify-center">
                            <div className="h-0.5 w-full bg-current" />
                        </div>
                    </Button>
                    <Button
                        variant={tool === OperationType.ARROW ? "default" : "outline"}
                        size="icon"
                        onClick={() => setTool(OperationType.ARROW)}
                        disabled={readOnly}
                        title="Arrow"
                    >
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={tool === OperationType.TEXT ? "default" : "outline"}
                        size="icon"
                        onClick={() => setTool(OperationType.TEXT)}
                        disabled={readOnly}
                        title="Text"
                    >
                        <Type className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={tool === OperationType.MOVE ? "default" : "outline"}
                        size="icon"
                        onClick={() => setTool(OperationType.MOVE)}
                        disabled={readOnly}
                        title="Move"
                    >
                        <Move className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center space-x-2 ml-2">
                        <input
                            type="color"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            className="w-8 h-8 rounded cursor-pointer"
                            disabled={readOnly}
                            title="Color"
                        />
                        <select
                            value={lineWidth}
                            onChange={(e) => setLineWidth(Number(e.target.value))}
                            className="h-8 rounded border px-2"
                            disabled={readOnly}
                            title="Line Width"
                        >
                            <option value="1">Thin</option>
                            <option value="2">Medium</option>
                            <option value="4">Thick</option>
                            <option value="8">Very Thick</option>
                        </select>
                    </div>
                </div>
                <div className="flex space-x-1">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleUndo}
                        disabled={readOnly || localOperations.length === 0}
                        title="Undo"
                    >
                        <Undo className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleRedo}
                        disabled={readOnly || redoStack.length === 0}
                        title="Redo"
                    >
                        <Redo className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleClear}
                        disabled={readOnly}
                        className="text-destructive hover:text-destructive"
                        title="Clear"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            <div className="flex-1 relative overflow-hidden bg-white">
                <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 w-full h-full"
                    style={{ cursor: tool === OperationType.MOVE ? "move" : "crosshair" }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                />
                <input
                    ref={textInputRef}
                    type="text"
                    className="absolute hidden p-1 border border-gray-300 bg-white"
                    style={{
                        minWidth: "100px",
                        fontFamily: "Arial",
                        fontSize: "16px",
                        color: color,
                    }}
                    onKeyDown={handleTextSubmit}
                    placeholder="Type and press Enter"
                />
            </div>
        </div>
    )
}
