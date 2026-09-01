import { useContext } from 'react'
import { AuthContext } from '../app/providers/AuthContext.js'

export default function useCurrentUser() {
  const session = useContext(AuthContext)

  if (!session) {
    throw new Error('useCurrentUser must be used within AuthProvider.')
  }

  return session
}
