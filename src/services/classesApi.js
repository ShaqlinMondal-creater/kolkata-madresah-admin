import { API_BASE_URL } from '@/config/apiConfig'

async function parseJson(response) {
  const text = await response.text()
  try {
    return text ? JSON.parse(text) : {}
  } catch {
    throw new Error('Invalid response from server')
  }
}

export async function getClassesByYear(ayId, term = '', options = {}) {
  const body = {}
  if (ayId) body.ay_id = Number(ayId)
  if (term) body.term = term
  if (options.includeStudentCount) body.include_student_count = 1

  const response = await fetch(`${API_BASE_URL}/classes/list.php`, {
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
