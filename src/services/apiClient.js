import { API_BASE_URL } from '@/config/apiConfig'
import { clearAuthUser } from '@/auth/authStorage'

let forcingLogout = false

function isAuthEndpoint(url) {
  const path = String(url || '')
  return (
    path.includes('/auth/login.php') ||
    path.includes('/auth/logout.php')
  )
}

function isUnauthorizedPayload(response, data) {
  if (response?.status === 401) return true
  if (Number(data?.status) === 401) return true
  const message = String(data?.message || '').toLowerCase()
  return message.includes('unauthorized') || message.includes('please login')
}

/**
 * Session expired / invalid — clear local auth and go to login.
 * Skips login/logout endpoints to avoid loops.
 */
export function forceLogoutToHome(requestUrl = '') {
  if (forcingLogout || isAuthEndpoint(requestUrl)) return
  forcingLogout = true

  clearAuthUser()

  fetch(`${API_BASE_URL}/auth/logout.php`, {
    method: 'POST',
    credentials: 'include',
    headers: { Accept: 'application/json' },
  }).catch(() => {
    // ignore network errors while forcing logout
  })

  const path = window.location.pathname || '/'
  if (path !== '/') {
    window.location.replace('/')
  } else {
    forcingLogout = false
  }
}

export async function parseJson(response, requestUrl = '') {
  const text = await response.text()
  let data = {}
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    throw new Error('Invalid response from server')
  }

  if (isUnauthorizedPayload(response, data)) {
    forceLogoutToHome(requestUrl || response.url || '')
  }

  return data
}

/** Shared fetch wrapper — credentials + JSON Accept by default */
export async function apiFetch(pathOrUrl, options = {}) {
  const url = String(pathOrUrl).startsWith('http')
    ? pathOrUrl
    : `${API_BASE_URL}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`

  const response = await fetch(url, {
    credentials: 'include',
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.headers || {}),
    },
  })

  return parseJson(response, url)
}
