import { v4 as uuidv4 } from "uuid"
import type {
    CanvasOperation,
    PathOperation,
    RectangleOperation,
    CircleOperation,
    LineOperation,
    ArrowOperation,
    TextOperation,
    ImageOperation,
    ClearOperation,
    MoveOperation,
} from "@/types/canvas"
import { OperationType } from "@/types/canvas"

// Create a draw operation
export function createDrawOperation(
    points: { x: number; y: number }[],
    strokeColor = "#000000",
    strokeWidth = 2,
    userId?: string,
): PathOperation {
    return {
        id: uuidv4(),
        type: OperationType.DRAW,
        timestamp: Date.now(),
        userId,
        points,
        strokeColor, // Ensure strokeColor is included
        strokeWidth,
    }
}

// Create an erase operation
export function createEraseOperation(
    points: { x: number; y: number }[],
    strokeWidth = 20,
    userId?: string,
): PathOperation {
    return {
        id: uuidv4(),
        type: OperationType.ERASE,
        timestamp: Date.now(),
        userId,
        points,
        strokeWidth,
    }
}

// Create a rectangle operation
export function createRectangleOperation(
    x: number,
    y: number,
    width: number,
    height: number,
    strokeColor = "#000000",
    strokeWidth = 2,
    fillColor?: string,
    userId?: string,
): RectangleOperation {
    return {
        id: uuidv4(),
        type: OperationType.RECTANGLE,
        timestamp: Date.now(),
        userId,
        x,
        y,
        width,
        height,
        strokeColor,
        strokeWidth,
        fillColor,
    }
}

// Create a circle operation
export function createCircleOperation(
    x: number,
    y: number,
    radius: number,
    strokeColor = "#000000",
    strokeWidth = 2,
    fillColor?: string,
    userId?: string,
): CircleOperation {
    return {
        id: uuidv4(),
        type: OperationType.CIRCLE,
        timestamp: Date.now(),
        userId,
        x,
        y,
        radius,
        strokeColor,
        strokeWidth,
        fillColor,
    }
}

// Create a line operation
export function createLineOperation(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    strokeColor = "#000000",
    strokeWidth = 2,
    userId?: string,
): LineOperation {
    return {
        id: uuidv4(),
        type: OperationType.LINE,
        timestamp: Date.now(),
        userId,
        x1,
        y1,
        x2,
        y2,
        strokeColor,
        strokeWidth,
    }
}

// Create an arrow operation
export function createArrowOperation(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    strokeColor = "#000000",
    strokeWidth = 2,
    userId?: string,
): ArrowOperation {
    return {
        id: uuidv4(),
        type: OperationType.ARROW,
        timestamp: Date.now(),
        userId,
        x1,
        y1,
        x2,
        y2,
        strokeColor,
        strokeWidth,
    }
}

// Create a text operation
export function createTextOperation(
    x: number,
    y: number,
    text: string,
    fontSize = 16,
    fontFamily = "Arial",
    textColor = "#000000",
    userId?: string,
): TextOperation {
    return {
        id: uuidv4(),
        type: OperationType.TEXT,
        timestamp: Date.now(),
        userId,
        x,
        y,
        text,
        fontSize,
        fontFamily,
        textColor,
    }
}

// Create an image operation
export function createImageOperation(
    x: number,
    y: number,
    width: number,
    height: number,
    src: string,
    userId?: string,
): ImageOperation {
    return {
        id: uuidv4(),
        type: OperationType.IMAGE,
        timestamp: Date.now(),
        userId,
        x,
        y,
        width,
        height,
        src,
    }
}

// Create a clear operation
export function createClearOperation(userId?: string): ClearOperation {
    return {
        id: uuidv4(),
        type: OperationType.CLEAR,
        timestamp: Date.now(),
        userId,
    }
}

// Create a move operation
export function createMoveOperation(dx: number, dy: number, userId?: string): MoveOperation {
    return {
        id: uuidv4(),
        type: OperationType.MOVE,
        timestamp: Date.now(),
        userId,
        dx,
        dy,
    }
}

// Serialize operation to JSON string
export function serializeOperation(operation: CanvasOperation): string {
    return JSON.stringify(operation)
}

// Deserialize operation from JSON string
export function deserializeOperation(json: string): CanvasOperation {
    return JSON.parse(json) as CanvasOperation
}
