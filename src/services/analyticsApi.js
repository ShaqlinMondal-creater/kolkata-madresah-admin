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
  const params = new URLSearchParams()
  if (ayId) params.set('ay_id', String(ayId))

  const query = params.toString()
  const url = `${API_BASE_URL}/analytics/dashboard.php${query ? `?${query}` : ''}`

  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })

  return parseJson(response)
}
