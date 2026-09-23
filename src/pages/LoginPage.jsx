import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import BrandPanel from '@/components/brand/BrandPanel'
import LoginForm from '@/components/auth/LoginForm'
import { content } from '@/config/appConfig'
import { ADMIN_USERLEVEL, STUDENT_USERLEVEL } from '@/config/apiConfig'
import { loginRequest } from '@/services/authApi'
import { getAuthUser, setAuthUser, clearAuthUser } from '@/auth/authStorage'

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const existing = getAuthUser()
  const initialMode = useMemo(() => {
    const mode = String(searchParams.get('mode') || '').toLowerCase()
    return mode === 'student' ? 'student' : 'admin'
  }, [searchParams])
  const [mode, setMode] = useState(initialMode) // admin | student
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (existing?.userlevel === ADMIN_USERLEVEL) {
    return <Navigate to="/dashboard" replace />
  }
  if (existing?.userlevel === STUDENT_USERLEVEL) {
    return <Navigate to="/student" replace />
  }

  function switchMode(next) {
    setMode(next)
    setError('')
    setUsername('')
    setPassword('')
    navigate(next === 'student' ? '/login?mode=student' : '/login', {
      replace: true,
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const user = username.trim()
    const isStudent = mode === 'student'
    const copy = isStudent ? content.studentLogin : content.login

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

      if (isStudent) {
        if (response.data.userlevel !== STUDENT_USERLEVEL) {
          clearAuthUser()
          setError(copy.studentOnlyError)
          return
        }

        setAuthUser({
          username: response.data.username,
          st_id: response.data.st_id,
          role: response.data.role || 'student',
          userlevel: response.data.userlevel,
          type: 'student',
          switched: false,
        })
        navigate('/student', { replace: true })
        return
      }

      if (response.data.userlevel !== ADMIN_USERLEVEL) {
        clearAuthUser()
        setError(content.login.adminOnlyError)
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
      setError(
        isStudent
          ? content.studentLogin.networkError
          : content.login.networkError,
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={`login-layout${mode === 'student' ? ' is-student' : ' is-admin'}`}
    >
      <section className="login-layout__brand" aria-label="Kolkata Madresah">
        <div className="login-brand-stage" aria-hidden={false}>
          <div className="login-brand-stage__panel login-brand-stage__panel--admin">
            <BrandPanel variant="admin" />
          </div>
          <div className="login-brand-stage__panel login-brand-stage__panel--student">
            <BrandPanel variant="student" />
          </div>
        </div>
      </section>

      <aside
        className="login-layout__auth"
        aria-label={mode === 'student' ? 'Student login' : 'Admin login'}
      >
        <LoginForm
          mode={mode}
          username={username}
          password={password}
          error={error}
          loading={loading}
          onUsernameChange={setUsername}
          onPasswordChange={setPassword}
          onSubmit={handleSubmit}
          onSwitchMode={switchMode}
        />
      </aside>
    </div>
  )
}
