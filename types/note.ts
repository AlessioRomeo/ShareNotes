export interface Note {
  id: string
  title: string
  content: string
  ownerId: string
  createdAt: string
  updatedAt: string
  isPublic: boolean
  collaborators: Collaborator[]
}

export interface Collaborator {
  userId: string
  role: 'viewer' | 'editor'
  addedAt: string
}

export interface CreateNoteRequest {
  title: string
  content?: string
  isPublic?: boolean
}

export interface UpdateNoteRequest {
  title?: string
  content?: string
  isPublic?: boolean
} 