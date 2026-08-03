import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  getAuthUser,
  clearAuthUser,
  AUTH_UPDATED_EVENT,
} from '@/auth/authStorage'
import { logoutRequest } from '@/services/authApi'
import { site, getCopyrightText } from '@/config/appConfig'
import { adminNavItems } from '@/config/adminNav'
import {
  IconChevron,
  IconLogout,
  IconMenu,
  IconProfile,
} from '@/components/icons/AdminIcons'

const SIDEBAR_KEY = 'km_sidebar_collapsed'

export default function AdminLayout() {
  const navigate = useNavigate()
  const [user, setUser] = useState(() => getAuthUser())
  const displayName = user?.username || 'Admin'
  const initial = displayName.charAt(0).toUpperCase()

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_KEY) === '1'
    } catch {
      return false
    }
  })
  const [mobileOpen, setMobileOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
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

  function goProfile() {
    setMenuOpen(false)
    navigate('/profile')
  }

  return (
    <div className={`admin${collapsed ? ' admin--collapsed' : ''}${mobileOpen ? ' admin--mobile-open' : ''}`}>
      <div
        className="admin__overlay"
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      <aside className="admin__sidebar" aria-label="Main navigation">
        <div className="admin__brand">
          <img src={site.logoImage} alt="" className="admin__logo" />
          <div className="admin__brand-text">
            <p className="admin__brand-eyebrow text-gold-gradient">{site.name}</p>
            <p className="admin__brand-title text-gold-gradient">Admin</p>
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
          {adminNavItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `admin__nav-link${isActive ? ' is-active' : ''}`
                }
                title={item.label}
                onClick={() => setMobileOpen(false)}
              >
                <span className="admin__nav-icon">
                  <Icon />
                </span>
                <span className="admin__nav-label text-gold-gradient">{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <p className="admin__sidebar-foot">{getCopyrightText()}</p>
      </aside>

      <div className="admin__shell">
        <header className="admin__topbar">
          <button
            type="button"
            className="admin__mobile-toggle"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Open menu"
          >
            <IconMenu />
          </button>

          <div className="admin__topbar-spacer" />

          <div className="admin__top-actions">
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
                <span className="admin__user-name text-gold-gradient">{displayName}</span>
              </button>

              {menuOpen ? (
                <div className="admin__dropdown" role="menu">
                  <button
                    type="button"
                    className="admin__dropdown-item"
                    role="menuitem"
                    onClick={goProfile}
                  >
                    <IconProfile />
                    Profile
                  </button>
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

            <button
              type="button"
              className="admin__icon-btn"
              onClick={handleLogout}
              aria-label="Logout"
              title="Logout"
            >
              <IconLogout />
            </button>
          </div>
        </header>

        <main className="admin__main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
