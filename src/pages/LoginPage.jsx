import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import BrandPanel from '@/components/brand/BrandPanel'
import LoginForm from '@/components/auth/LoginForm'
import { content } from '@/config/appConfig'
import { ADMIN_USERLEVEL } from '@/config/apiConfig'
import { loginRequest } from '@/services/authApi'
import { getAuthUser, setAuthUser, clearAuthUser } from '@/auth/authStorage'

export default function LoginPage() {
  const navigate = useNavigate()
  const existing = getAuthUser()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const copy = content.login

  if (existing?.userlevel === ADMIN_USERLEVEL) {
    return <Navigate to="/dashboard" replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const user = username.trim()
    if (!user || !password.trim()) {
      setError(copy.emptyError)
      return
    }

    setLoading(true)
    try {
      const response = await loginRequest(user, password)

      if (Number(response.status) !== 200 || !response.data?.userlevel) {
        clearAuthUser()
        setError(response.message || copy.invalidError)
        return
      }

      // This React portal is admin-only (same gate as old _admin/userlevel.php)
      if (response.data.userlevel !== ADMIN_USERLEVEL) {
        clearAuthUser()
        setError(copy.adminOnlyError)
        return
      }

      setAuthUser({
        username: response.data.username,
        role: response.data.role,
        userlevel: response.data.userlevel,
        type: response.data.type,
      })
      navigate('/dashboard', { replace: true })
    } catch {
      clearAuthUser()
      setError(copy.networkError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-layout">
      <section className="login-layout__brand" aria-label="Kolkata Madresah">
        <BrandPanel />
      </section>

      <aside className="login-layout__auth" aria-label="Admin login">
        <LoginForm
          username={username}
          password={password}
          error={error}
          loading={loading}
          onUsernameChange={setUsername}
          onPasswordChange={setPassword}
          onSubmit={handleSubmit}
        />
      </aside>
    </div>
  )
}
