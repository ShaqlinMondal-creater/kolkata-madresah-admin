import { Navigate, useLocation } from 'react-router-dom'
import { getAuthUser } from '@/auth/authStorage'
import { STUDENT_USERLEVEL } from '@/config/apiConfig'

export default function StudentProtectedRoute({ children }) {
  const location = useLocation()
  const user = getAuthUser()

  if (!user || user.userlevel !== STUDENT_USERLEVEL) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />
  }

  return children
}
