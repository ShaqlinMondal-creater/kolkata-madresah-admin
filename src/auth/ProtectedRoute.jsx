import { Navigate, useLocation } from 'react-router-dom'
import { getAuthUser } from '@/auth/authStorage'
import { ADMIN_USERLEVEL } from '@/config/apiConfig'

export default function ProtectedRoute({ children }) {
  const location = useLocation()
  const user = getAuthUser()

  if (!user || user.userlevel !== ADMIN_USERLEVEL) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />
  }

  return children
}
