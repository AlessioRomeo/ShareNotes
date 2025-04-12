import { NoteGrid } from "@/components/note-grid"

export default function SharedWithMePage() {
  // In a real app, we would fetch notes shared with the user from an API
  const sharedNotes = [
    {
      id: "101",
      title: "Q2 Marketing Plan",
      description: "Marketing strategy and campaign ideas for Q2",
      updatedAt: "2023-04-18T14:30:00Z",
      collaborators: 4,
      sharedBy: "Sarah Johnson",
    },
    {
      id: "102",
      title: "Website Redesign",
      description: "Mockups and feedback for the new website design",
      updatedAt: "2023-04-16T09:45:00Z",
      collaborators: 6,
      sharedBy: "Michael Chen",
    },
    {
      id: "103",
      title: "Product Feature Brainstorm",
      description: "Ideas for new product features and improvements",
      updatedAt: "2023-04-14T11:20:00Z",
      collaborators: 3,
      sharedBy: "Alex Rodriguez",
    },
    {
      id: "104",
      title: "Client Presentation",
      description: "Slides for the upcoming client presentation",
      updatedAt: "2023-04-10T16:15:00Z",
      collaborators: 2,
      sharedBy: "Emily Wong",
    },
  ]

  return (
    <div className="space-y-6 w-full h-full">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Shared with me</h2>
        <p className="text-muted-foreground">Notes and whiteboards that others have shared with you</p>
      </div>
      <NoteGrid notes={sharedNotes} showSharedBy={true} />
    </div>
  )
}

