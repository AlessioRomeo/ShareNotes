export interface Note {
  id: string
  title: string
  description: string
  content: string
  ownerId: string
  created_at: string
  updated_at: string
  shared_with: Collaborator[]
}

export interface Collaborator {
  user_email: string
  can_update: boolean
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
