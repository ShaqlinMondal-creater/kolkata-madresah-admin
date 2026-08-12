import { API_BASE_URL } from '@/config/apiConfig'
import { parseJson } from '@/services/apiClient'

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
