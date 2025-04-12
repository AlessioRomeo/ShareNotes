export interface User {
  id: string
  name: string
  email: string
  avatarUrl?: string
  createdAt: string
  updatedAt: string
}

export interface UpdateProfileRequest {
  name?: string
  email?: string
  avatar?: File
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
} 