// Define the types of canvas operations
export enum OperationType {
    DRAW = "draw",
    ERASE = "erase",
    RECTANGLE = "rectangle",
    CIRCLE = "circle",
    LINE = "line",
    ARROW = "arrow",
    TEXT = "text",
    IMAGE = "image",
    CLEAR = "clear",
    MOVE = "move",
}

// Base interface for all operations
export interface BaseOperation {
    id: string
    type: OperationType
    timestamp: number
    userId?: string // For collaborative editing
}

// Path-based operations (drawing, erasing)
export interface PathOperation extends BaseOperation {
    type: OperationType.DRAW | OperationType.ERASE
    points: { x: number; y: number }[]
    strokeColor?: string // Make strokeColor optional
    strokeWidth: number
}

// Shape operations
export interface RectangleOperation extends BaseOperation {
    type: OperationType.RECTANGLE
    x: number
    y: number
    width: number
    height: number
    strokeColor: string
    strokeWidth: number
    fillColor?: string
}

export interface CircleOperation extends BaseOperation {
    type: OperationType.CIRCLE
    x: number
    y: number
    radius: number
    strokeColor: string
    strokeWidth: number
    fillColor?: string
}

export interface LineOperation extends BaseOperation {
    type: OperationType.LINE
    x1: number
    y1: number
    x2: number
    y2: number
    strokeColor: string
    strokeWidth: number
}

export interface ArrowOperation extends BaseOperation {
    type: OperationType.ARROW
    x1: number
    y1: number
    x2: number
    y2: number
    strokeColor: string
    strokeWidth: number
}

// Text operation
export interface TextOperation extends BaseOperation {
    type: OperationType.TEXT
    x: number
    y: number
    text: string
    fontSize: number
    fontFamily: string
    textColor: string
}

// Image operation
export interface ImageOperation extends BaseOperation {
    type: OperationType.IMAGE
    x: number
    y: number
    width: number
    height: number
    src: string // Base64 or URL
}

// Clear operation
export interface ClearOperation extends BaseOperation {
    type: OperationType.CLEAR
}

// Move operation (for panning the canvas)
export interface MoveOperation extends BaseOperation {
    type: OperationType.MOVE
    dx: number // Delta x
    dy: number // Delta y
}

// Union type for all operations
export type CanvasOperation =
    | PathOperation
    | RectangleOperation
    | CircleOperation
    | LineOperation
    | ArrowOperation
    | TextOperation
    | ImageOperation
    | ClearOperation
    | MoveOperation
