import { API_BASE_URL } from '@/config/apiConfig'

async function parseJson(response) {
  const text = await response.text()
  try {
    return text ? JSON.parse(text) : {}
  } catch {
    throw new Error('Invalid response from server')
  }
}

/** Season / academic-year list for filters */
export async function getAcademicYears(term = '') {
  const params = new URLSearchParams()
  if (term) params.set('term', term)

  const query = params.toString()
  const url = `${API_BASE_URL}/academic-year/list.php${query ? `?${query}` : ''}`

  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })

  return parseJson(response)
}
