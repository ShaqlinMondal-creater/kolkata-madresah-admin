import { useState } from 'react'
import { content, site } from '@/config/appConfig'
import { EyeOffIcon, EyeOpenIcon } from '@/components/icons/EyeIcons'

export default function LoginForm({
  mode = 'admin',
  username,
  password,
  error,
  loading = false,
  onUsernameChange,
  onPasswordChange,
  onSubmit,
  onSwitchMode,
}) {
  const [showPassword, setShowPassword] = useState(false)
  const isStudent = mode === 'student'
  const copy = isStudent ? content.studentLogin : content.login

  return (
    <div className={`login-form${isStudent ? ' login-form--student' : ''}`}>
      <div className="login-form__head">
        <p className="login-form__eyebrow">{copy.eyebrow}</p>
        <h2 className="login-form__title">{copy.title}</h2>
        <p className="login-form__sub">{copy.subtitle}</p>
      </div>

      <form className="login-form__form" onSubmit={onSubmit} noValidate>
        <label className="login-form__field">
          <span>{copy.usernameLabel}</span>
          <input
            type="text"
            name={isStudent ? 'roll_no' : 'username'}
            autoComplete="username"
            value={username}
            onChange={(e) => onUsernameChange(e.target.value)}
            placeholder={copy.usernamePlaceholder}
            disabled={loading}
          />
        </label>

        <label className="login-form__field">
          <span>{copy.passwordLabel}</span>
          <div className="login-form__password-wrap">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder={copy.passwordPlaceholder}
              disabled={loading}
            />
            <button
              type="button"
              className="login-form__eye"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              title={showPassword ? 'Hide password' : 'Show password'}
              disabled={loading}
            >
              {showPassword ? <EyeOpenIcon /> : <EyeOffIcon />}
            </button>
          </div>
        </label>

        {error ? <p className="login-form__error">{error}</p> : null}

        <button
          type="submit"
          className={`login-form__submit${isStudent ? ' login-form__submit--student' : ''}`}
          disabled={loading}
        >
          {loading ? copy.loadingLabel : copy.submitLabel}
        </button>
      </form>

      {typeof onSwitchMode === 'function' ? (
        <p className="login-form__switch">
          {isStudent ? (
            <button type="button" onClick={() => onSwitchMode('admin')}>
              {content.login.switchToAdmin}
            </button>
          ) : (
            <button
              type="button"
              className="login-form__switch-btn"
              onClick={() => onSwitchMode('student')}
            >
              {content.login.switchToStudent}
            </button>
          )}
        </p>
      ) : null}

      <p className="login-form__footer">
        <a href={site.url} target="_blank" rel="noreferrer">
          kolkatamadresah.com
        </a>
      </p>
    </div>
  )
}
