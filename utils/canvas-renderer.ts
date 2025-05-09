import {
    OperationType,
    type CanvasOperation,
    type PathOperation,
    type RectangleOperation,
    type CircleOperation,
    type LineOperation,
    type ArrowOperation,
    type TextOperation,
    type ImageOperation,
} from "@/types/canvas"

// Helper function to draw an arrow
function drawArrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, headLength = 10) {
    // Calculate the angle of the line
    const angle = Math.atan2(y2 - y1, x2 - x1)

    // Draw the main line
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()

    // Draw the arrow head
    ctx.beginPath()
    ctx.moveTo(x2, y2)
    ctx.lineTo(x2 - headLength * Math.cos(angle - Math.PI / 6), y2 - headLength * Math.sin(angle - Math.PI / 6))
    ctx.lineTo(x2 - headLength * Math.cos(angle + Math.PI / 6), y2 - headLength * Math.sin(angle + Math.PI / 6))
    ctx.closePath()
    ctx.fill()
}

// Main function to render operations on canvas
export function renderOperation(ctx: CanvasRenderingContext2D, operation: CanvasOperation): void {
    switch (operation.type) {
        case OperationType.DRAW:
            renderDrawOperation(ctx, operation as PathOperation)
            break
        case OperationType.ERASE:
            renderEraseOperation(ctx, operation as PathOperation)
            break
        case OperationType.RECTANGLE:
            renderRectangleOperation(ctx, operation as RectangleOperation)
            break
        case OperationType.CIRCLE:
            renderCircleOperation(ctx, operation as CircleOperation)
            break
        case OperationType.LINE:
            renderLineOperation(ctx, operation as LineOperation)
            break
        case OperationType.ARROW:
            renderArrowOperation(ctx, operation as ArrowOperation)
            break
        case OperationType.TEXT:
            renderTextOperation(ctx, operation as TextOperation)
            break
        case OperationType.IMAGE:
            renderImageOperation(ctx, operation as ImageOperation)
            break
        case OperationType.CLEAR:
            renderClearOperation(ctx, operation)
            break
        default:
            console.warn(`Unknown operation type: ${(operation as any).type}`)
    }
}

// Render all operations in sequence
export function renderOperations(ctx: CanvasRenderingContext2D, operations: CanvasOperation[]): void {
    // Clear canvas first
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    // Fill with white background
    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    // Render operations in order
    operations.forEach((operation) => {
        renderOperation(ctx, operation)
    })
}

// Individual rendering functions for each operation type
function renderDrawOperation(ctx: CanvasRenderingContext2D, operation: PathOperation): void {
    if (operation.points.length < 2) return

    ctx.beginPath()
    ctx.moveTo(operation.points[0].x, operation.points[0].y)

    for (let i = 1; i < operation.points.length; i++) {
        ctx.lineTo(operation.points[i].x, operation.points[i].y)
    }

    ctx.strokeStyle = operation.strokeColor || "#000000"
    ctx.lineWidth = operation.strokeWidth
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.stroke()
}

function renderEraseOperation(ctx: CanvasRenderingContext2D, operation: PathOperation): void {
    // Save current composite operation
    const currentCompositeOperation = ctx.globalCompositeOperation

    // Set to erase mode
    ctx.globalCompositeOperation = "destination-out"

    // Draw with a round brush
    if (operation.points.length < 2) return

    ctx.beginPath()
    ctx.moveTo(operation.points[0].x, operation.points[0].y)

    for (let i = 1; i < operation.points.length; i++) {
        ctx.lineTo(operation.points[i].x, operation.points[i].y)
    }

    ctx.strokeStyle = "rgba(0,0,0,1)"
    ctx.lineWidth = operation.strokeWidth
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.stroke()

    // Restore previous composite operation
    ctx.globalCompositeOperation = currentCompositeOperation
}

function renderRectangleOperation(ctx: CanvasRenderingContext2D, operation: RectangleOperation): void {
    ctx.beginPath()
    ctx.rect(operation.x, operation.y, operation.width, operation.height)

    if (operation.fillColor) {
        ctx.fillStyle = operation.fillColor
        ctx.fill()
    }

    ctx.strokeStyle = operation.strokeColor
    ctx.lineWidth = operation.strokeWidth
    ctx.stroke()
}

function renderCircleOperation(ctx: CanvasRenderingContext2D, operation: CircleOperation): void {
    ctx.beginPath()
    ctx.arc(operation.x, operation.y, operation.radius, 0, Math.PI * 2)

    if (operation.fillColor) {
        ctx.fillStyle = operation.fillColor
        ctx.fill()
    }

    ctx.strokeStyle = operation.strokeColor
    ctx.lineWidth = operation.strokeWidth
    ctx.stroke()
}

function renderLineOperation(ctx: CanvasRenderingContext2D, operation: LineOperation): void {
    ctx.beginPath()
    ctx.moveTo(operation.x1, operation.y1)
    ctx.lineTo(operation.x2, operation.y2)
    ctx.strokeStyle = operation.strokeColor
    ctx.lineWidth = operation.strokeWidth
    ctx.stroke()
}

function renderArrowOperation(ctx: CanvasRenderingContext2D, operation: ArrowOperation): void {
    ctx.strokeStyle = operation.strokeColor
    ctx.fillStyle = operation.strokeColor
    ctx.lineWidth = operation.strokeWidth

    drawArrow(ctx, operation.x1, operation.y1, operation.x2, operation.y2, 10 + operation.strokeWidth)
}

function renderTextOperation(ctx: CanvasRenderingContext2D, operation: TextOperation): void {
    ctx.font = `${operation.fontSize}px ${operation.fontFamily}`
    ctx.fillStyle = operation.textColor
    ctx.fillText(operation.text, operation.x, operation.y)
}

function renderImageOperation(ctx: CanvasRenderingContext2D, operation: ImageOperation): void {
    // Create a new image element
    const img = new Image()
    img.crossOrigin = "anonymous" // Avoid CORS issues

    // Set up onload handler to draw the image when it's loaded
    img.onload = () => {
        ctx.drawImage(img, operation.x, operation.y, operation.width, operation.height)
    }

    // Set the source to trigger loading
    img.src = operation.src
}

function renderClearOperation(ctx: CanvasRenderingContext2D, _operation: CanvasOperation): void {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
}
