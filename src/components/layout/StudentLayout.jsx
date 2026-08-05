import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  getAuthUser,
  setAuthUser,
  clearAuthUser,
  AUTH_UPDATED_EVENT,
} from '@/auth/authStorage'
import { logoutRequest } from '@/services/authApi'
import { switchBackAdmin } from '@/services/switchApi'
import { site, getCopyrightText } from '@/config/appConfig'
import { studentNavItems } from '@/config/studentNav'
import {
  IconChevron,
  IconLogout,
  IconMenu,
} from '@/components/icons/AdminIcons'

const SIDEBAR_KEY = 'km_student_sidebar_collapsed'

export default function StudentLayout() {
  const navigate = useNavigate()
  const [user, setUser] = useState(() => getAuthUser())
  const displayName = user?.name || user?.username || 'Student'
  const initial = displayName.charAt(0).toUpperCase()
  const switched = !!user?.switched

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_KEY) === '1'
    } catch {
      return false
    }
  })
  const [mobileOpen, setMobileOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [switching, setSwitching] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_KEY, collapsed ? '1' : '0')
    } catch {
      /* ignore */
    }
  }, [collapsed])

  useEffect(() => {
    function onDocClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    function onAuthUpdated() {
      setUser(getAuthUser())
    }
    document.addEventListener('mousedown', onDocClick)
    window.addEventListener(AUTH_UPDATED_EVENT, onAuthUpdated)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      window.removeEventListener(AUTH_UPDATED_EVENT, onAuthUpdated)
    }
  }, [])

  async function handleLogout() {
    setMenuOpen(false)
    await logoutRequest()
    clearAuthUser()
    navigate('/', { replace: true })
  }

  async function handleSwitchBack() {
    setMenuOpen(false)
    setSwitching(true)
    try {
      const res = await switchBackAdmin()
      if (Number(res.status) === 200 && res.data?.userlevel) {
        setAuthUser({
          username: res.data.username,
          role: res.data.role,
          userlevel: res.data.userlevel,
          type: 'staff',
          switched: false,
        })
        navigate('/students', { replace: true })
      } else {
        window.alert(res.message || 'Could not switch back to admin.')
      }
    } catch {
      window.alert('Switch-back API unavailable. Upload APIs/auth/switch_back_admin.php')
    } finally {
      setSwitching(false)
    }
  }

  return (
    <div
      className={`admin student-shell${collapsed ? ' admin--collapsed' : ''}${
        mobileOpen ? ' admin--mobile-open' : ''
      }`}
    >
      <div
        className="admin__overlay"
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      <aside className="admin__sidebar" aria-label="Student navigation">
        <div className="admin__brand">
          <img src={site.logoImage} alt="" className="admin__logo" />
          <div className="admin__brand-text">
            <p className="admin__brand-eyebrow text-gold-gradient">{site.name}</p>
            <p className="admin__brand-title text-gold-gradient">Student</p>
          </div>
          <button
            type="button"
            className="admin__collapse"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            <IconChevron />
          </button>
        </div>

        <nav className="admin__nav">
          {studentNavItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={!!item.end}
                className={({ isActive }) =>
                  `admin__nav-link${isActive ? ' is-active' : ''}`
                }
                title={item.label}
                onClick={() => setMobileOpen(false)}
              >
                <span className="admin__nav-icon">
                  <Icon />
                </span>
                <span className="admin__nav-label text-gold-gradient">
                  {item.label}
                </span>
              </NavLink>
            )
          })}
        </nav>

        <p className="admin__sidebar-foot">{getCopyrightText()}</p>
      </aside>

      <div className="admin__shell">
        <header className="admin__topbar student-shell__topbar">
          <button
            type="button"
            className="admin__mobile-toggle"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Open menu"
          >
            <IconMenu />
          </button>

          <div className="admin__topbar-spacer" />

          <div className="admin__top-actions student-shell__top-actions">
            {switched ? (
              <div className="student-shell__banner">
                Viewing as student
                <button
                  type="button"
                  onClick={handleSwitchBack}
                  disabled={switching}
                >
                  {switching ? 'Switching…' : 'Switch back to Admin'}
                </button>
              </div>
            ) : null}

            <div className="admin__user-menu" ref={menuRef}>
              <button
                type="button"
                className="admin__user-btn"
                onClick={() => setMenuOpen((v) => !v)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
              >
                <span className="admin__avatar" aria-hidden="true">
                  {initial}
                </span>
                <span className="admin__user-name text-gold-gradient">
                  {displayName}
                </span>
              </button>

              {menuOpen ? (
                <div className="admin__dropdown" role="menu">
                  {switched ? (
                    <button
                      type="button"
                      className="admin__dropdown-item"
                      role="menuitem"
                      onClick={handleSwitchBack}
                      disabled={switching}
                    >
                      Switch back to Admin
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="admin__dropdown-item admin__dropdown-item--danger"
                    role="menuitem"
                    onClick={handleLogout}
                  >
                    <IconLogout />
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main className="admin__main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
