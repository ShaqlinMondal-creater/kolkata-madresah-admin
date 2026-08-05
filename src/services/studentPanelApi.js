import { API_BASE_URL } from '@/config/apiConfig'

async function parseJson(response) {
  const text = await response.text()
  try {
    return text ? JSON.parse(text) : {}
  } catch {
    throw new Error('Invalid response from server')
  }
}

async function postJson(path, body = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
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

export async function getStudentDashboard() {
  return postJson('/student-panel/dashboard.php')
}

export async function getStudentFees(status = 'pending', ayId = '') {
  const body = { status }
  if (ayId === 'all') body.ay_id = 'all'
  else if (ayId !== '' && ayId != null) body.ay_id = Number(ayId)
  return postJson('/student-panel/fees.php', body)
}

/** Update logged-in student's mobile and/or its_id */
export async function updateStudentProfile(fields = {}) {
  const body = {}
  if (Object.prototype.hasOwnProperty.call(fields, 'mobile')) {
    body.mobile = fields.mobile
  }
  if (Object.prototype.hasOwnProperty.call(fields, 'its_id')) {
    body.its_id = fields.its_id
  }
  return postJson('/student-panel/update_profile.php', body)
}

/**
 * Logged-in student's transactions
 * @param {{ mode?: string, date_from?: string, date_to?: string, page?: number, perpage?: number }} filters
 */
export async function getStudentTransactions(filters = {}) {
  const body = {}
  if (filters.mode) body.mode = filters.mode
  if (filters.date_from) body.date_from = filters.date_from
  if (filters.date_to) body.date_to = filters.date_to
  if (filters.page) body.page = Number(filters.page)
  if (filters.perpage) body.perpage = Number(filters.perpage)
  return postJson('/student-panel/transactions.php', body)
}

/** Single transaction belonging to the logged-in student */
export async function getStudentTransactionDetails(txnId) {
  return postJson('/student-panel/transaction_details.php', {
    txn_id: Number(txnId),
  })
}
