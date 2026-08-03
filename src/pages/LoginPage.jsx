import { useState } from 'react'
import BrandPanel from '@/components/brand/BrandPanel'
import LoginForm from '@/components/auth/LoginForm'
import { content } from '@/config/appConfig'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const copy = content.login

  function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!username.trim() || !password.trim()) {
      setError(copy.emptyError)
      return
    }

    setError(copy.apiPendingError)
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
          onUsernameChange={setUsername}
          onPasswordChange={setPassword}
          onSubmit={handleSubmit}
        />
      </aside>
    </div>
  )
}
