"use client"

import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

import type React from "react"

import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  Pencil,
  Square,
  Circle,
  Type,
  Eraser,
  Undo2,
  Redo2,
  Save,
  Download,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"

type Tool = "pencil" | "rectangle" | "circle" | "text" | "image" | "eraser"
type TextStyle = "title" | "subtitle" | "paragraph" | null

interface DrawingState {
  startX: number
  startY: number
  isDrawing: boolean
  preview: boolean
  textAreaActive: boolean
  textContent: string
  textAreaWidth: number
  textAreaHeight: number
  textStyleSelectionActive: boolean
  textStyle: TextStyle
}

interface Page {
  id: string
  imageData: ImageData | null
  history: ImageData[]
  currentHistoryIndex: number
}

export function Whiteboard() {
  const { toast } = useToast()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const thumbnailCanvasRef = useRef<HTMLCanvasElement>(null)
  const [tool, setTool] = useState<Tool>("pencil")
  const [color, setColor] = useState("#000000")
  const [brushSize, setBrushSize] = useState([5])
  const [isDrawing, setIsDrawing] = useState(false)
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 })
  const [drawingState, setDrawingState] = useState<DrawingState>({
    startX: 0,
    startY: 0,
    isDrawing: false,
    preview: false,
    textAreaActive: false,
    textContent: "",
    textAreaWidth: 0,
    textAreaHeight: 0,
    textStyleSelectionActive: false,
    textStyle: null,
  })
  const [isDownloading, setIsDownloading] = useState(false)

  // Multi-page state
  const [pages, setPages] = useState<Page[]>([])
  const [currentPageIndex, setCurrentPageIndex] = useState(0)

  // Add state to track if undo/redo is available
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  // Store a reference to the canvas context for use in multiple functions
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)

  // Track if we're currently in the middle of an operation
  const isOperationInProgressRef = useRef(false)

  // Initialize the whiteboard with one blank page
  useEffect(() => {
    const initialPage: Page = {
      id: generateId(),
      imageData: null,
      history: [],
      currentHistoryIndex: -1,
    }

    setPages([initialPage])
  }, [])

  // Set up the canvas when the component mounts or when the current page changes
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctxRef.current = ctx

    // Set canvas size to match parent container
    const resizeCanvas = () => {
      const parent = canvas.parentElement
      if (parent) {
        canvas.width = parent.clientWidth
        canvas.height = parent.clientHeight

        // If we have image data for the current page, restore it
        const currentPage = pages[currentPageIndex]
        if (currentPage && currentPage.imageData) {
          ctx.putImageData(currentPage.imageData, 0, 0)
        } else {
          // Otherwise, fill with white background
          ctx.fillStyle = "white"
          ctx.fillRect(0, 0, canvas.width, canvas.height)

          // Save initial state for this page
          saveCanvasState()
        }
      }
    }

    if (pages.length > 0) {
      resizeCanvas()
      updateUndoRedoState()
    }

    window.addEventListener("resize", resizeCanvas)

    return () => {
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [pages, currentPageIndex])

  // Update thumbnails whenever pages change
  useEffect(() => {
    updateThumbnails()
  }, [pages, currentPageIndex])

  // Generate a unique ID for each page
  const generateId = () => {
    return Math.random().toString(36).substring(2, 9)
  }

  // Update the undo/redo state based on the current page's history
  const updateUndoRedoState = () => {
    if (pages.length === 0 || currentPageIndex >= pages.length) return

    const currentPage = pages[currentPageIndex]
    setCanUndo(currentPage.currentHistoryIndex > 0)
    setCanRedo(currentPage.currentHistoryIndex < currentPage.history.length - 1)
  }

  // Save the current canvas state to the current page's history
  const saveCanvasState = () => {
    // Don't save state if we're in the middle of an operation
    if (isOperationInProgressRef.current) return

    const canvas = canvasRef.current
    if (!canvas || !ctxRef.current || pages.length === 0) return

    // Get current canvas state
    const imageData = ctxRef.current.getImageData(0, 0, canvas.width, canvas.height)

    setPages((prevPages) => {
      const newPages = [...prevPages]
      const currentPage = { ...newPages[currentPageIndex] }

      // If we're not at the end of the history, remove future states
      if (currentPage.currentHistoryIndex < currentPage.history.length - 1) {
        currentPage.history = currentPage.history.slice(0, currentPage.currentHistoryIndex + 1)
      }

      // Add current state to history
      currentPage.history.push(imageData)
      currentPage.currentHistoryIndex = currentPage.history.length - 1

      // Also update the current image data for thumbnails
      currentPage.imageData = imageData

      newPages[currentPageIndex] = currentPage
      return newPages
    })

    // Update undo/redo availability
    updateUndoRedoState()

    // Update thumbnails
    updateThumbnails()
  }

  // Create a thumbnail of the current canvas
  const updateThumbnails = () => {
    if (!thumbnailCanvasRef.current || pages.length === 0) return

    const canvas = canvasRef.current
    if (!canvas) return

    // We'll update all thumbnails when needed
    pages.forEach((page, index) => {
      if (page.imageData) {
        createThumbnail(page.imageData, index === currentPageIndex)
      }
    })
  }

  // Create a thumbnail from the given image data
  const createThumbnail = (imageData: ImageData, isCurrentPage: boolean) => {
    const thumbnailCanvas = thumbnailCanvasRef.current
    if (!thumbnailCanvas) return

    const ctx = thumbnailCanvas.getContext("2d")
    if (!ctx) return

    // Scale down the image data to thumbnail size
    const scaleFactor = 0.2 // 20% of original size
    thumbnailCanvas.width = imageData.width * scaleFactor
    thumbnailCanvas.height = imageData.height * scaleFactor

    // Create a temporary canvas to draw the full-size image
    const tempCanvas = document.createElement("canvas")
    tempCanvas.width = imageData.width
    tempCanvas.height = imageData.height
    const tempCtx = tempCanvas.getContext("2d")
    if (!tempCtx) return

    tempCtx.putImageData(imageData, 0, 0)

    // Draw the scaled image to the thumbnail canvas
    ctx.drawImage(tempCanvas, 0, 0, thumbnailCanvas.width, thumbnailCanvas.height)
  }

  // Add a new blank page
  const addNewPage = () => {
    // Save the current canvas state before adding a new page
    saveCanvasState()

    const newPage: Page = {
      id: generateId(),
      imageData: null,
      history: [],
      currentHistoryIndex: -1,
    }

    setPages((prevPages) => [...prevPages, newPage])
    setCurrentPageIndex(pages.length) // Set to the new page index

    // Clear the canvas for the new page
    const canvas = canvasRef.current
    if (canvas && ctxRef.current) {
      ctxRef.current.fillStyle = "white"
      ctxRef.current.fillRect(0, 0, canvas.width, canvas.height)

      // Save initial state for the new page
      setTimeout(() => {
        saveCanvasState()
      }, 0)
    }
  }

  // Delete the current page
  const deleteCurrentPage = () => {
    if (pages.length <= 1) return // Don't delete the last page

    setPages((prevPages) => {
      const newPages = [...prevPages]
      newPages.splice(currentPageIndex, 1)
      return newPages
    })

    // Adjust current page index if needed
    if (currentPageIndex >= pages.length - 1) {
      setCurrentPageIndex(pages.length - 2)
    }
  }

  // Navigate to the previous page
  const goToPreviousPage = () => {
    if (currentPageIndex > 0) {
      // Save current page state before switching
      saveCanvasState()
      setCurrentPageIndex(currentPageIndex - 1)
    }
  }

  // Navigate to the next page
  const goToNextPage = () => {
    if (currentPageIndex < pages.length - 1) {
      // Save current page state before switching
      saveCanvasState()
      setCurrentPageIndex(currentPageIndex + 1)
    }
  }

  // Navigate to a specific page
  const goToPage = (pageIndex: number) => {
    if (pageIndex >= 0 && pageIndex < pages.length) {
      // Save current page state before switching
      saveCanvasState()
      setCurrentPageIndex(pageIndex)
    }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas || !ctxRef.current) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (tool === "pencil" || tool === "eraser") {
      // Save the current state before starting to draw
      saveCanvasState()
      isOperationInProgressRef.current = true

      setIsDrawing(true)
      setLastPosition({ x, y })
    } else if (tool === "rectangle" || tool === "circle" || tool === "text") {
      // For shapes and text, we'll set up the drawing state
      saveCanvasState()
      isOperationInProgressRef.current = true

      setDrawingState({
        startX: x,
        startY: y,
        isDrawing: true,
        preview: false,
        textAreaActive: false,
        textContent: "",
        textAreaWidth: 0,
        textAreaHeight: 0,
        textStyleSelectionActive: false,
        textStyle: null,
      })
    }
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas || !ctxRef.current) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (tool === "pencil" && isDrawing) {
      ctxRef.current.strokeStyle = color
      ctxRef.current.lineWidth = brushSize[0]
      ctxRef.current.lineCap = "round"
      ctxRef.current.lineJoin = "round"

      ctxRef.current.beginPath()
      ctxRef.current.moveTo(lastPosition.x, lastPosition.y)
      ctxRef.current.lineTo(x, y)
      ctxRef.current.stroke()

      setLastPosition({ x, y })
    } else if (tool === "eraser" && isDrawing) {
      ctxRef.current.globalCompositeOperation = "destination-out"
      ctxRef.current.beginPath()
      ctxRef.current.arc(x, y, brushSize[0] * 2, 0, Math.PI * 2, false)
      ctxRef.current.fill()
      ctxRef.current.globalCompositeOperation = "source-over"

      setLastPosition({ x, y })
    } else if ((tool === "rectangle" || tool === "circle") && drawingState.isDrawing) {
      // For shapes, we need to restore the canvas to its state before the preview
      if (drawingState.preview && pages[currentPageIndex]?.history.length > 0) {
        // Get the last history state for the current page
        const lastState = pages[currentPageIndex].history[pages[currentPageIndex].currentHistoryIndex]
        if (lastState) {
          ctxRef.current.putImageData(lastState, 0, 0)
        }
      } else {
        setDrawingState((prev) => ({ ...prev, preview: true }))
      }

      // Draw the shape preview
      drawShape(drawingState.startX, drawingState.startY, x, y)
    } else if (tool === "text" && drawingState.isDrawing) {
      // For text, we need to restore the canvas to its state before the preview
      if (drawingState.preview && pages[currentPageIndex]?.history.length > 0) {
        // Get the last history state for the current page
        const lastState = pages[currentPageIndex].history[pages[currentPageIndex].currentHistoryIndex]
        if (lastState) {
          ctxRef.current.putImageData(lastState, 0, 0)
        }
      } else {
        setDrawingState((prev) => ({ ...prev, preview: true }))
      }

      // Draw the text area preview
      drawTextAreaPreview(drawingState.startX, drawingState.startY, x, y)
    }
  }

  // Add a new function to draw the text area preview
  const drawTextAreaPreview = (startX: number, startY: number, endX: number, endY: number) => {
    if (!ctxRef.current) return

    const ctx = ctxRef.current
    ctx.strokeStyle = color
    ctx.lineWidth = 1
    ctx.setLineDash([5, 3]) // Dashed line for text area

    const width = endX - startX
    const height = endY - startY
    ctx.strokeRect(startX, startY, width, height)

    ctx.setLineDash([]) // Reset to solid line
  }

  const stopDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === "pencil" || tool === "eraser") {
      if (!isDrawing) return

      setIsDrawing(false)
      isOperationInProgressRef.current = false

      // Save the state after finishing a pencil or eraser stroke
      saveCanvasState()
    } else if ((tool === "rectangle" || tool === "circle") && drawingState.isDrawing) {
      const canvas = canvasRef.current
      if (!canvas || !ctxRef.current) return

      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      // Draw the final shape
      drawShape(drawingState.startX, drawingState.startY, x, y)

      // Reset drawing state
      setDrawingState({
        startX: 0,
        startY: 0,
        isDrawing: false,
        preview: false,
        textAreaActive: false,
        textContent: "",
        textAreaWidth: 0,
        textAreaHeight: 0,
        textStyleSelectionActive: false,
        textStyle: null,
      })

      isOperationInProgressRef.current = false

      // Save the canvas state after drawing the shape
      saveCanvasState()
    } else if (tool === "text" && drawingState.isDrawing) {
      const canvas = canvasRef.current
      if (!canvas || !ctxRef.current) return

      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      // Only activate text area if it has some size
      if (Math.abs(x - drawingState.startX) > 10 && Math.abs(y - drawingState.startY) > 10) {
        // Show text style selection dialog
        setDrawingState((prev) => ({
          ...prev,
          isDrawing: false,
          preview: false,
          textAreaActive: false,
          textStyleSelectionActive: true,
          // Ensure startX is always the left edge and startY is always the top edge
          startX: Math.min(drawingState.startX, x),
          startY: Math.min(drawingState.startY, y),
          // Store width and height in separate properties
          textAreaWidth: Math.abs(x - drawingState.startX),
          textAreaHeight: Math.abs(y - drawingState.startY),
          textContent: "",
        }))
      } else {
        // If the area is too small, reset
        setDrawingState({
          startX: 0,
          startY: 0,
          isDrawing: false,
          preview: false,
          textAreaActive: false,
          textContent: "",
          textAreaWidth: 0,
          textAreaHeight: 0,
          textStyleSelectionActive: false,
          textStyle: null,
        })

        isOperationInProgressRef.current = false
      }
    }
  }

  const drawShape = (startX: number, startY: number, endX: number, endY: number) => {
    if (!ctxRef.current) return

    const ctx = ctxRef.current
    ctx.strokeStyle = color
    ctx.lineWidth = brushSize[0]

    if (tool === "rectangle") {
      const width = endX - startX
      const height = endY - startY
      ctx.strokeRect(startX, startY, width, height)
    } else if (tool === "circle") {
      const radiusX = Math.abs(endX - startX) / 2
      const radiusY = Math.abs(endY - startY) / 2
      const centerX = startX + (endX - startX) / 2
      const centerY = startY + (endY - startY) / 2

      ctx.beginPath()
      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2)
      ctx.stroke()
    }
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas || !ctxRef.current) return

    ctxRef.current.fillStyle = "white"
    ctxRef.current.fillRect(0, 0, canvas.width, canvas.height)

    // Save the cleared state
    saveCanvasState()
  }

  const addText = () => {
    const canvas = canvasRef.current
    if (!canvas || !ctxRef.current) return

    const text = prompt("Enter text:")
    if (!text) return

    // Save state before adding text
    saveCanvasState()
    isOperationInProgressRef.current = true

    const x = canvas.width / 2
    const y = canvas.height / 2

    ctxRef.current.font = `${brushSize[0] * 3}px sans-serif`
    ctxRef.current.fillStyle = color
    ctxRef.current.textAlign = "center"
    ctxRef.current.fillText(text, x, y)

    isOperationInProgressRef.current = false
    // Save state after adding text
    saveCanvasState()
  }

  const handleToolClick = (selectedTool: Tool) => {
    setTool(selectedTool)
  }

  const handleUndo = () => {
    if (pages.length === 0 || currentPageIndex >= pages.length) return

    const currentPage = pages[currentPageIndex]
    if (currentPage.currentHistoryIndex <= 0) return

    // Update the page's history index
    setPages((prevPages) => {
      const newPages = [...prevPages]
      const updatedPage = { ...newPages[currentPageIndex] }
      updatedPage.currentHistoryIndex--

      // Apply the previous state to the canvas
      const previousState = updatedPage.history[updatedPage.currentHistoryIndex]
      if (ctxRef.current && previousState && canvasRef.current) {
        ctxRef.current.putImageData(previousState, 0, 0)
        updatedPage.imageData = previousState
      }

      newPages[currentPageIndex] = updatedPage
      return newPages
    })

    // Update undo/redo availability
    updateUndoRedoState()
  }

  const handleRedo = () => {
    if (pages.length === 0 || currentPageIndex >= pages.length) return

    const currentPage = pages[currentPageIndex]
    if (currentPage.currentHistoryIndex >= currentPage.history.length - 1) return

    // Update the page's history index
    setPages((prevPages) => {
      const newPages = [...prevPages]
      const updatedPage = { ...newPages[currentPageIndex] }
      updatedPage.currentHistoryIndex++

      // Apply the next state to the canvas
      const nextState = updatedPage.history[updatedPage.currentHistoryIndex]
      if (ctxRef.current && nextState && canvasRef.current) {
        ctxRef.current.putImageData(nextState, 0, 0)
        updatedPage.imageData = nextState
      }

      newPages[currentPageIndex] = updatedPage
      return newPages
    })

    // Update undo/redo availability
    updateUndoRedoState()
  }

  // Function to get a formatted date string for filenames
  const getFormattedDate = () => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}-${String(now.getMinutes()).padStart(2, "0")}`
  }

  // Improved function to download the current page
  const handleSaveImage = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    try {
      // Make sure the canvas is properly rendered
      if (pages[currentPageIndex]?.imageData && ctxRef.current) {
        ctxRef.current.putImageData(pages[currentPageIndex].imageData, 0, 0)
      }

      // Create a descriptive filename with date and page number
      const dateStr = getFormattedDate()
      const filename = `notecanvas_page${currentPageIndex + 1}_${dateStr}.png`

      // Create a temporary link element
      const link = document.createElement("a")
      link.download = filename
      link.href = canvas.toDataURL("image/png")
      link.click()

      // Show success toast
      toast({
        title: "Page downloaded",
        description: `Page ${currentPageIndex + 1} has been downloaded successfully.`,
        duration: 3000,
      })
    } catch (error) {
      console.error("Error downloading image:", error)
      toast({
        title: "Download failed",
        description: "There was an error downloading the page. Please try again.",
        variant: "destructive",
        duration: 3000,
      })
    }
  }

  // Improved function to download all pages
  const handleSaveAllPages = async () => {
    if (isDownloading) return
    if (pages.length === 0) return

    setIsDownloading(true)

    try {
      // Show initial toast
      toast({
        title: "Preparing download",
        description: `Preparing ${pages.length} pages for download...`,
        duration: 3000,
      })

      // Create a temporary canvas for rendering pages
      const tempCanvas = document.createElement("canvas")
      const mainCanvas = canvasRef.current

      if (!mainCanvas) {
        throw new Error("Canvas not available")
      }

      tempCanvas.width = mainCanvas.width
      tempCanvas.height = mainCanvas.height
      const tempCtx = tempCanvas.getContext("2d")

      if (!tempCtx) {
        throw new Error("Canvas context not available")
      }

      // Create a descriptive base filename with date
      const dateStr = getFormattedDate()
      const baseFilename = `notecanvas_${dateStr}`

      // Download each page with a small delay to prevent browser blocking
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i]

        if (page.imageData) {
          // Clear the temp canvas and draw the page
          tempCtx.fillStyle = "white"
          tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)
          tempCtx.putImageData(page.imageData, 0, 0)

          // Create filename with page number
          const filename = `${baseFilename}_page${i + 1}.png`

          // Create download link
          const link = document.createElement("a")
          link.download = filename
          link.href = tempCanvas.toDataURL("image/png")

          // Trigger download
          link.click()

          // Wait a short time between downloads to prevent browser blocking
          if (i < pages.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 500))
          }
        }
      }

      // Show success toast
      toast({
        title: "All pages downloaded",
        description: `${pages.length} pages have been downloaded successfully.`,
        duration: 3000,
      })
    } catch (error) {
      console.error("Error downloading all pages:", error)
      toast({
        title: "Download failed",
        description: "There was an error downloading all pages. Please try again.",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setIsDownloading(false)
    }
  }

  // Handle text style selection
  const handleTextStyleSelect = (style: TextStyle) => {
    setDrawingState((prev) => ({
      ...prev,
      textStyleSelectionActive: false,
      textAreaActive: true,
      textStyle: style,
    }))
  }

  // Add a function to handle text input
  const handleTextInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDrawingState((prev) => ({
      ...prev,
      textContent: e.target.value,
    }))
  }

  // Get font size based on text style
  const getFontSize = () => {
    switch (drawingState.textStyle) {
      case "title":
        return brushSize[0] * 6 // Increased from 4 to 6
      case "subtitle":
        return brushSize[0] * 4.5 // Increased from 3 to 4.5
      case "paragraph":
      default:
        return brushSize[0] * 3 // Increased from 2 to 3
    }
  }

  // Get font weight based on text style
  const getFontWeight = () => {
    switch (drawingState.textStyle) {
      case "title":
        return "bold"
      case "subtitle":
        return "600"
      case "paragraph":
      default:
        return "normal"
    }
  }

  // Add a function to finalize text
  const finalizeText = () => {
    if (!drawingState.textAreaActive || !ctxRef.current || !canvasRef.current) return

    // First, restore the canvas to its state before the outline was drawn
    if (pages[currentPageIndex]?.history.length > 0) {
      const lastState = pages[currentPageIndex].history[pages[currentPageIndex].currentHistoryIndex]
      if (lastState) {
        ctxRef.current.putImageData(lastState, 0, 0)
      }
    }

    // Use the stored dimensions
    const width = drawingState.textAreaWidth
    const height = drawingState.textAreaHeight
    const text = drawingState.textContent

    // Draw the text on the canvas
    const ctx = ctxRef.current

    // Set font based on text style
    const fontSize = getFontSize()
    const fontWeight = getFontWeight()
    ctx.font = `${fontWeight} ${fontSize}px sans-serif`
    ctx.fillStyle = color
    ctx.textBaseline = "top"

    // Word wrap the text to fit the text area
    const words = text.split(" ")
    let line = ""
    let y = drawingState.startY + 5 // Add a small padding
    const lineHeight = fontSize * 1.2 // Approximate line height
    const maxWidth = width - 10 // Subtract padding

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + " "
      const metrics = ctx.measureText(testLine)
      const testWidth = metrics.width

      if (testWidth > maxWidth && i > 0) {
        ctx.fillText(line, drawingState.startX + 5, y)
        line = words[i] + " "
        y += lineHeight

        // Check if we've exceeded the height
        if (y > drawingState.startY + height - lineHeight) {
          break
        }
      } else {
        line = testLine
      }
    }

    // Draw the last line
    ctx.fillText(line, drawingState.startX + 5, y)

    // Reset the drawing state completely to remove the outline
    setDrawingState({
      startX: 0,
      startY: 0,
      isDrawing: false,
      preview: false,
      textAreaActive: false,
      textContent: "",
      textAreaWidth: 0,
      textAreaHeight: 0,
      textStyleSelectionActive: false,
      textStyle: null,
    })

    isOperationInProgressRef.current = false

    // Save the canvas state after adding text
    saveCanvasState()
  }

  // Add a function to cancel text input
  const cancelTextInput = () => {
    setDrawingState({
      startX: 0,
      startY: 0,
      isDrawing: false,
      preview: false,
      textAreaActive: false,
      textContent: "",
      textAreaWidth: 0,
      textAreaHeight: 0,
      textStyleSelectionActive: false,
      textStyle: null,
    })

    isOperationInProgressRef.current = false
  }

  return (
    <div className="h-full w-full flex flex-col">
      <div className="bg-muted p-2 border-b flex items-center gap-2 overflow-x-auto shrink-0">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={tool === "pencil" ? "default" : "outline"}
                size="icon"
                onClick={() => handleToolClick("pencil")}
              >
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Pencil</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Pencil</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={tool === "rectangle" ? "default" : "outline"}
                size="icon"
                onClick={() => handleToolClick("rectangle")}
              >
                <Square className="h-4 w-4" />
                <span className="sr-only">Rectangle</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Rectangle (click and drag)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={tool === "circle" ? "default" : "outline"}
                size="icon"
                onClick={() => handleToolClick("circle")}
              >
                <Circle className="h-4 w-4" />
                <span className="sr-only">Circle</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Circle (click and drag)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={tool === "text" ? "default" : "outline"}
                size="icon"
                onClick={() => handleToolClick("text")}
              >
                <Type className="h-4 w-4" />
                <span className="sr-only">Text</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Text</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={tool === "eraser" ? "default" : "outline"}
                size="icon"
                onClick={() => handleToolClick("eraser")}
              >
                <Eraser className="h-4 w-4" />
                <span className="sr-only">Eraser</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Eraser</TooltipContent>
          </Tooltip>

          <div className="h-6 w-px bg-border mx-1" />

          <div className="flex items-center gap-2">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-8 h-8 rounded-md cursor-pointer border"
            />
            <div className="w-32">
              <Slider value={brushSize} min={1} max={20} step={1} onValueChange={setBrushSize} />
            </div>
          </div>

          <div className="h-6 w-px bg-border mx-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={handleUndo}
                disabled={!canUndo}
                className={!canUndo ? "opacity-50 cursor-not-allowed" : ""}
              >
                <Undo2 className="h-4 w-4" />
                <span className="sr-only">Undo</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Undo</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRedo}
                disabled={!canRedo}
                className={!canRedo ? "opacity-50 cursor-not-allowed" : ""}
              >
                <Redo2 className="h-4 w-4" />
                <span className="sr-only">Redo</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Redo</TooltipContent>
          </Tooltip>

          <div className="h-6 w-px bg-border mx-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={clearCanvas}>
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Clear</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Clear current page</TooltipContent>
          </Tooltip>

          <div className="h-6 w-px bg-border mx-1" />

          {/* Page navigation controls */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToPreviousPage}
                  disabled={currentPageIndex === 0}
                  className={currentPageIndex === 0 ? "opacity-50 cursor-not-allowed" : ""}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Previous page</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Previous page</TooltipContent>
            </Tooltip>

            <div className="px-2 text-sm">
              Page {currentPageIndex + 1} of {pages.length}
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToNextPage}
                  disabled={currentPageIndex === pages.length - 1}
                  className={currentPageIndex === pages.length - 1 ? "opacity-50 cursor-not-allowed" : ""}
                >
                  <ChevronRight className="h-4 w-4" />
                  <span className="sr-only">Next page</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Next page</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={addNewPage}>
                  <Plus className="h-4 w-4" />
                  <span className="sr-only">Add page</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add new page</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={deleteCurrentPage}
                  disabled={pages.length <= 1}
                  className={pages.length <= 1 ? "opacity-50 cursor-not-allowed" : ""}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete page</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete current page</TooltipContent>
            </Tooltip>
          </div>

          <div className="ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={isDownloading}>
                  <Save className="h-4 w-4 mr-2" />
                  {isDownloading ? "Downloading..." : "Save"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleSaveImage} disabled={isDownloading}>
                  <Download className="h-4 w-4 mr-2" />
                  Download current page
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSaveAllPages} disabled={isDownloading}>
                  <Download className="h-4 w-4 mr-2" />
                  Download all pages
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled={isDownloading}>
                  <Save className="h-4 w-4 mr-2" />
                  Save to cloud
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TooltipProvider>
      </div>

      <div className="flex-1 relative bg-white w-full h-full border border-border">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />

        {/* Text Style Selection Dialog */}
        {drawingState.textStyleSelectionActive && (
          <div
            className="absolute bg-white border-2 border-primary rounded-md shadow-lg p-3 z-20"
            style={{
              left: `${drawingState.startX + drawingState.textAreaWidth / 2 - 100}px`,
              top: `${drawingState.startY + drawingState.textAreaHeight / 2 - 70}px`,
              width: "200px",
            }}
          >
            <h3 className="text-sm font-medium mb-2 text-center">Select Text Style</h3>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                className="justify-start font-bold text-lg"
                onClick={() => handleTextStyleSelect("title")}
              >
                Title
              </Button>
              <Button
                variant="outline"
                className="justify-start font-semibold text-base"
                onClick={() => handleTextStyleSelect("subtitle")}
              >
                Subtitle
              </Button>
              <Button
                variant="outline"
                className="justify-start font-normal text-sm"
                onClick={() => handleTextStyleSelect("paragraph")}
              >
                Paragraph
              </Button>
              <Button variant="ghost" size="sm" onClick={cancelTextInput}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Text Input Area */}
        {drawingState.textAreaActive && (
          <div
            className="absolute bg-white border-2 border-primary"
            style={{
              left: `${drawingState.startX}px`,
              top: `${drawingState.startY}px`,
              width: `${drawingState.textAreaWidth}px`,
              height: `${drawingState.textAreaHeight}px`,
              zIndex: 10,
            }}
          >
            <textarea
              className="w-full h-full p-1 border-none resize-none focus:ring-0 focus:outline-none"
              value={drawingState.textContent}
              onChange={handleTextInput}
              autoFocus
              onBlur={finalizeText}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  cancelTextInput()
                } else if (e.key === "Enter" && e.shiftKey === false) {
                  e.preventDefault()
                  finalizeText()
                }
              }}
              style={{
                fontSize: `${getFontSize()}px`,
                lineHeight: `${getFontSize() * 1.2}px`,
                fontWeight: getFontWeight(),
                color: color,
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

