import { API_BASE_URL } from '@/config/apiConfig'

async function parseJson(response) {
  const text = await response.text()
  try {
    return text ? JSON.parse(text) : {}
  } catch {
    throw new Error('Invalid response from server')
  }
}

export async function loginRequest(username, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ username, password }),
  })

  return parseJson(response)
}

export async function logoutRequest() {
  try {
    await fetch(`${API_BASE_URL}/auth/logout.php`, {
      method: 'POST',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    })
  } catch {
    // Still clear local auth even if network fails
  }
}

export async function getProfileRequest() {
  const response = await fetch(`${API_BASE_URL}/auth/profile.php`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({}),
  })
  return parseJson(response)
}

export async function updateProfileRequest({
  name,
  email,
  mobile,
  new_password = '',
  confirm_password = '',
}) {
  const response = await fetch(`${API_BASE_URL}/auth/update_profile.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      name,
      email,
      mobile,
      new_password,
      confirm_password,
    }),
  })
  return parseJson(response)
}
