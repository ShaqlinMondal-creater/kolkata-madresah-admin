import { API_BASE_URL } from '@/config/apiConfig'
import { parseJson } from '@/services/apiClient'

/** Build POST body with only actively set filters */
export function buildFeesPayload(filters = {}) {
  const body = {}

  const search = typeof filters.search === 'string' ? filters.search.trim() : ''
  if (search) body.search = search

  if (filters.ay_id !== undefined && filters.ay_id !== null && filters.ay_id !== '') {
    body.ay_id = Number(filters.ay_id)
  }

  const cgIds = Array.isArray(filters.cg_id)
    ? filters.cg_id.map(Number).filter((id) => id > 0)
    : filters.cg_id
      ? [Number(filters.cg_id)].filter((id) => id > 0)
      : []
  if (cgIds.length) body.cg_id = cgIds

  if (filters.status === 'pending' || filters.status === 'paid') {
    body.status = filters.status
  }

  if (filters.due_from) body.due_from = filters.due_from
  if (filters.due_to) body.due_to = filters.due_to

  if (filters.page) body.page = Number(filters.page)
  if (filters.perpage) body.perpage = Number(filters.perpage)

  return body
}

export async function getFeesList(filters = {}) {
  const body = buildFeesPayload(filters)

  const response = await fetch(`${API_BASE_URL}/fees/list.php`, {
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
