import { API_BASE_URL } from '@/config/apiConfig'
import { parseJson } from '@/services/apiClient'

/** Build POST body with only actively set filters */
export function buildTransactionsPayload(filters = {}) {
  const body = {}

  const search = typeof filters.search === 'string' ? filters.search.trim() : ''
  if (search) body.search = search

  if (filters.mode === 'pg' || filters.mode === 'cash' || filters.mode === 'internal') {
    body.mode = filters.mode
  }

  if (filters.date_from) body.date_from = filters.date_from
  if (filters.date_to) body.date_to = filters.date_to

  if (filters.page) body.page = Number(filters.page)
  if (filters.perpage) body.perpage = Number(filters.perpage)

  return body
}

export async function getTransactionsList(filters = {}) {
  const body = buildTransactionsPayload(filters)

  const response = await fetch(
    `${API_BASE_URL}/transactions/transaction_list.php`,
    {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    },
  )

  return parseJson(response)
}

export async function getTransactionDetails(txnId) {
  const response = await fetch(
    `${API_BASE_URL}/transactions/transaction_details.php`,
    {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ txn_id: Number(txnId) }),
    },
  )

  return parseJson(response)
}
