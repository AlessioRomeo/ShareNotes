// FILE: types/auth.ts

import { User } from '@/types/user'

/**
 * For logging in
 */
export interface LoginRequest {
  email: string
  password: string
}


export interface SignupRequest {
  username: string
  email: string
  password: string
  first_name: string
  last_name: string
  profile_picture_url?: string
}

/**
 * For receiving token from the backend
 */
export interface AuthResponse {
  token: string
}
