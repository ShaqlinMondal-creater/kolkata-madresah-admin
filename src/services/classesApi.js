import { API_BASE_URL } from '@/config/apiConfig'
import { parseJson } from '@/services/apiClient'

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

/** Create class for an academic year */
export async function createClass(payload) {
  const body = {
    ay_id: Number(payload.ay_id),
    cg_name: payload.cg_name,
  }
  if (payload.cg_section_number != null) {
    body.cg_section_number = payload.cg_section_number
  }
  if (payload.cg_order !== undefined && payload.cg_order !== '') {
    body.cg_order = payload.cg_order
  }

  const response = await fetch(`${API_BASE_URL}/classes/create.php`, {
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

/** Update existing class */
export async function updateClass(payload) {
  const body = {
    cg_id: Number(payload.cg_id),
    cg_name: payload.cg_name,
    cg_section_number: payload.cg_section_number ?? '',
  }
  if (payload.ay_id) body.ay_id = Number(payload.ay_id)
  if (payload.cg_order !== undefined && payload.cg_order !== '') {
    body.cg_order = payload.cg_order
  }

  const response = await fetch(`${API_BASE_URL}/classes/update.php`, {
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
