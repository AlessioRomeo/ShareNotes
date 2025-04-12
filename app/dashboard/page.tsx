import { NoteGrid } from "@/components/note-grid"

export default function Dashboard() {
  // In a real app, we would fetch the user's notes from an API
  const notes = [
    {
      id: "1",
      title: "Project Brainstorm",
      description: "Ideas for the new project",
      updatedAt: "2023-04-15T10:30:00Z",
      collaborators: 3,
    },
    {
      id: "2",
      title: "Team Meeting Notes",
      description: "Notes from our weekly team meeting",
      updatedAt: "2023-04-14T15:45:00Z",
      collaborators: 5,
    },
    {
      id: "3",
      title: "Product Roadmap",
      description: "Planning our product roadmap for Q2",
      updatedAt: "2023-04-12T09:15:00Z",
      collaborators: 2,
    },
    {
      id: "4",
      title: "UI Design Feedback",
      description: "Feedback on the new UI design",
      updatedAt: "2023-04-10T14:20:00Z",
      collaborators: 4,
    },
    {
      id: "5",
      title: "Marketing Strategy",
      description: "Ideas for our Q2 marketing campaign",
      updatedAt: "2023-04-08T11:10:00Z",
      collaborators: 3,
    },
    {
      id: "6",
      title: "Bug Tracking",
      description: "List of bugs to fix for the next release",
      updatedAt: "2023-04-05T16:30:00Z",
      collaborators: 2,
    },
  ]

  return (
    <div className="space-y-6 w-full h-full">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Your Notes</h2>
        <p className="text-muted-foreground">Create, manage, and collaborate on your notes</p>
      </div>
      <NoteGrid notes={notes} />
    </div>
  )
}

