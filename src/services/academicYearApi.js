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
  const response = await fetch(`${API_BASE_URL}/academic-year/list.php`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(term ? { term } : {}),
  })

  return parseJson(response)
}

export async function createAcademicYear(payload) {
  const response = await fetch(`${API_BASE_URL}/academic-year/create.php`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  })
  return parseJson(response)
}

export async function updateAcademicYear(payload) {
  const response = await fetch(`${API_BASE_URL}/academic-year/update.php`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  })
  return parseJson(response)
}

export async function setCurrentAcademicYear(ayId) {
  const response = await fetch(`${API_BASE_URL}/academic-year/set_current.php`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ ay_id: Number(ayId) }),
  })
  return parseJson(response)
}
