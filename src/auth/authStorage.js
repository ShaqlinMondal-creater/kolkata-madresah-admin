const AUTH_KEY = 'km_admin_auth'
export const AUTH_UPDATED_EVENT = 'km-auth-updated'

export function getAuthUser() {
  try {
    const raw = sessionStorage.getItem(AUTH_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function setAuthUser(user) {
  sessionStorage.setItem(AUTH_KEY, JSON.stringify(user))
  window.dispatchEvent(new Event(AUTH_UPDATED_EVENT))
}

export function clearAuthUser() {
  sessionStorage.removeItem(AUTH_KEY)
  window.dispatchEvent(new Event(AUTH_UPDATED_EVENT))
}

export function isLoggedIn() {
  return Boolean(getAuthUser()?.userlevel)
}
