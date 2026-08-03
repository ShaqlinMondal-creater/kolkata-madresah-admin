import { API_BASE_URL } from '@/config/apiConfig'

async function parseJson(response) {
  const text = await response.text()
  try {
    return text ? JSON.parse(text) : {}
  } catch {
    throw new Error('Invalid response from server')
  }
}

export async function getClassesByYear(ayId, term = '') {
  const params = new URLSearchParams()
  if (ayId) params.set('ay_id', String(ayId))
  if (term) params.set('term', term)

  const query = params.toString()
  const response = await fetch(
    `${API_BASE_URL}/classes/list.php${query ? `?${query}` : ''}`,
    {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    },
  )
  return parseJson(response)
}
