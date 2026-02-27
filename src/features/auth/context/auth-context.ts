import { createContext } from 'react'
import type { Session, User } from '../types'

export interface AuthContextType {
  session: Session | null
  user: User | null
  isLoading: boolean
}

export const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
})
