import { API_BASE_URL } from '@/config/apiConfig'

async function parseJson(response) {
  const text = await response.text()
  try {
    return text ? JSON.parse(text) : {}
  } catch {
    throw new Error('Invalid response from server')
  }
}

export async function getDashboardStats(ayId) {
  const body = {}
  if (ayId) body.ay_id = Number(ayId)

  const response = await fetch(`${API_BASE_URL}/analytics/dashboard.php`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  })

  return parseJson(response)
}
