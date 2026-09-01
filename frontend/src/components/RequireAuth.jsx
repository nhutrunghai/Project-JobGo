import { Navigate, useLocation } from 'react-router-dom'
import useCurrentUser from '../hooks/useCurrentUser.js'

function RequireAuth({ children }) {
  const location = useLocation()
  const { isAuthenticated, isLoading } = useCurrentUser()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}

export default RequireAuth
