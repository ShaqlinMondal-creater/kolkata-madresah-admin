import { API_BASE_URL } from '@/config/apiConfig'

async function parseJson(response) {
  const text = await response.text()
  try {
    return text ? JSON.parse(text) : {}
  } catch {
    throw new Error('Invalid response from server')
  }
}

export async function switchToStudent(stId) {
  const response = await fetch(`${API_BASE_URL}/auth/switch_to_student.php`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ st_id: Number(stId) }),
  })
  return parseJson(response)
}

export async function switchBackAdmin() {
  const response = await fetch(`${API_BASE_URL}/auth/switch_back_admin.php`, {
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
