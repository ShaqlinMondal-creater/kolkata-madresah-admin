import { API_BASE_URL } from '@/config/apiConfig'
import { parseJson } from '@/services/apiClient'

/** Build POST body with only actively set filters */
export function buildActionLogsPayload(filters = {}) {
  const body = {}

  const q = typeof filters.q === 'string' ? filters.q.trim() : ''
  if (q) body.q = q

  const action = typeof filters.action === 'string' ? filters.action.trim() : ''
  if (action) body.action = action

  const module = typeof filters.module === 'string' ? filters.module.trim() : ''
  if (module) body.module = module

  const username =
    typeof filters.username === 'string' ? filters.username.trim() : ''
  if (username) body.username = username

  const status = typeof filters.status === 'string' ? filters.status.trim() : ''
  if (status) body.status = status

  if (filters.st_id) body.st_id = Number(filters.st_id)
  if (filters.date_from) body.date_from = filters.date_from
  if (filters.date_to) body.date_to = filters.date_to
  if (filters.page) body.page = Number(filters.page)
  if (filters.perpage) body.perpage = Number(filters.perpage)

  return body
}

export async function getActionLogsList(filters = {}) {
  const body = buildActionLogsPayload(filters)

  const response = await fetch(`${API_BASE_URL}/action-logs/list.php`, {
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

export async function getActionLogDetails(id) {
  const response = await fetch(`${API_BASE_URL}/action-logs/details.php`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ id: Number(id) }),
  })

  return parseJson(response)
}
