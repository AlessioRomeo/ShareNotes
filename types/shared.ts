import { Collaborator } from './note'

export interface ShareRequest {
  noteId: string
  userId: string
  role: 'viewer' | 'editor'
}

export interface ShareResponse {
  noteId: string
  sharedWith: Collaborator[]
} 