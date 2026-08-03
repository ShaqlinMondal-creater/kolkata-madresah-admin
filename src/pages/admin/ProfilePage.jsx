import { useEffect, useState } from 'react'
import { getAuthUser, setAuthUser } from '@/auth/authStorage'
import { getProfileRequest, updateProfileRequest } from '@/services/authApi'
import { IconProfile } from '@/components/icons/AdminIcons'

function emptyPasswords() {
  return { new_password: '', confirm_password: '' }
}

export default function ProfilePage() {
  const cached = getAuthUser()
  const [form, setForm] = useState({
    name: cached?.name || '',
    email: cached?.email || '',
    mobile: cached?.mobile || '',
    ...emptyPasswords(),
  })
  const [savedForm, setSavedForm] = useState({
    name: cached?.name || '',
    email: cached?.email || '',
    mobile: cached?.mobile || '',
  })
  const [meta, setMeta] = useState({
    username: cached?.username || '',
    role: cached?.role || '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true

    async function load() {
      setLoading(true)
      setError('')
      try {
        const res = await getProfileRequest()
        if (!alive) return

        if (Number(res.status) === 200 && res.data) {
          const next = {
            name: res.data.name || '',
            email: res.data.email || '',
            mobile: res.data.mobile || '',
          }
          setForm({ ...next, ...emptyPasswords() })
          setSavedForm(next)
          setMeta({
            username: res.data.username || '',
            role: res.data.role || '',
          })
          setAuthUser({
            ...(getAuthUser() || {}),
            username: res.data.username,
            role: res.data.role,
            name: res.data.name,
            email: res.data.email,
            mobile: res.data.mobile,
            userlevel: res.data.userlevel,
            type: 'staff',
          })
        } else {
          setError(res.message || 'Unable to load profile.')
        }
      } catch {
        if (alive) setError('Unable to reach profile server. Please try again.')
      } finally {
        if (alive) setLoading(false)
      }
    }

    load()
    return () => {
      alive = false
    }
  }, [])

  function onChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setMessage('')
    setError('')
  }

  async function onSubmit(e) {
    e.preventDefault()
    setMessage('')
    setError('')

    if (!form.name.trim()) {
      setError('Full name is required.')
      return
    }

    if (form.new_password || form.confirm_password) {
      if (!form.new_password || !form.confirm_password) {
        setError('Enter both new password and confirm password.')
        return
      }
      if (form.new_password !== form.confirm_password) {
        setError('New password and confirm password do not match.')
        return
      }
      if (form.new_password.length < 6) {
        setError('Password must be at least 6 characters.')
        return
      }
    }

    setSaving(true)
    try {
      const res = await updateProfileRequest({
        name: form.name.trim(),
        email: form.email.trim(),
        mobile: form.mobile.trim(),
        new_password: form.new_password,
        confirm_password: form.confirm_password,
      })

      if (Number(res.status) === 200 && res.data) {
        const next = {
          name: res.data.name || '',
          email: res.data.email || '',
          mobile: res.data.mobile || '',
        }
        setForm({ ...next, ...emptyPasswords() })
        setSavedForm(next)
        setMeta({
          username: res.data.username || meta.username,
          role: res.data.role || meta.role,
        })
        setAuthUser({
          ...(getAuthUser() || {}),
          username: res.data.username,
          role: res.data.role,
          name: res.data.name,
          email: res.data.email,
          mobile: res.data.mobile,
          userlevel: res.data.userlevel,
          type: 'staff',
        })
        setMessage(res.message || 'Profile updated successfully.')
      } else {
        setError(res.message || 'Could not update profile.')
      }
    } catch {
      setError('Unable to reach profile server. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  function onReset() {
    setForm({ ...savedForm, ...emptyPasswords() })
    setMessage('')
    setError('')
  }

  const displayName = form.name.trim() || meta.username || 'Admin'
  const initial = displayName.charAt(0).toUpperCase()

  return (
    <section className="module-page profile-page">
      <header className="module-page__head">
        <h1 className="text-gold-gradient">Profile</h1>
        <p>View and update your account details.</p>
      </header>

      <div className="profile-layout">
        <aside className="profile-card profile-card--summary">
          <div className="profile-card__avatar" aria-hidden="true">
            {initial}
          </div>
          <h2 className="text-gold-gradient">{displayName}</h2>
          <p className="profile-card__role">{meta.role || 'Staff'}</p>
          {meta.username ? (
            <p className="profile-card__name">@{meta.username}</p>
          ) : null}
          <ul className="profile-card__facts">
            <li>
              <span>Email</span>
              <strong>{form.email || '—'}</strong>
            </li>
            <li>
              <span>Mobile</span>
              <strong>{form.mobile || '—'}</strong>
            </li>
          </ul>
        </aside>

        <div className="profile-card profile-card--form">
          <div className="profile-card__form-head">
            <span className="profile-card__icon">
              <IconProfile />
            </span>
            <div>
              <h3>Account details</h3>
              <p>Update name, contact info, and password.</p>
            </div>
          </div>

          {loading ? (
            <p className="profile-card__status">Loading profile…</p>
          ) : (
            <form className="profile-form" onSubmit={onSubmit} noValidate>
              <div className="profile-form__row profile-form__row--single">
                <label className="profile-form__field">
                  <span>Full name</span>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={onChange}
                    autoComplete="name"
                    disabled={saving}
                    placeholder="Enter full name"
                  />
                </label>
              </div>

              <div className="profile-form__row">
                <label className="profile-form__field">
                  <span>Email</span>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={onChange}
                    autoComplete="email"
                    disabled={saving}
                    placeholder="Enter email"
                  />
                </label>
                <label className="profile-form__field">
                  <span>Mobile no</span>
                  <input
                    type="tel"
                    name="mobile"
                    value={form.mobile}
                    onChange={onChange}
                    autoComplete="tel"
                    disabled={saving}
                    placeholder="Enter mobile number"
                  />
                </label>
              </div>

              <div className="profile-form__row">
                <label className="profile-form__field">
                  <span>New password</span>
                  <input
                    type="password"
                    name="new_password"
                    value={form.new_password}
                    onChange={onChange}
                    autoComplete="new-password"
                    disabled={saving}
                    placeholder="Leave blank to keep current"
                  />
                </label>
                <label className="profile-form__field">
                  <span>Confirm password</span>
                  <input
                    type="password"
                    name="confirm_password"
                    value={form.confirm_password}
                    onChange={onChange}
                    autoComplete="new-password"
                    disabled={saving}
                    placeholder="Re-enter new password"
                  />
                </label>
              </div>

              {error ? <p className="profile-form__error">{error}</p> : null}
              {message ? <p className="profile-form__success">{message}</p> : null}

              <div className="profile-form__actions">
                <button
                  type="button"
                  className="profile-form__secondary"
                  onClick={onReset}
                  disabled={saving || loading}
                >
                  Reset
                </button>
                <button
                  type="submit"
                  className="profile-form__submit"
                  disabled={saving || loading}
                >
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
