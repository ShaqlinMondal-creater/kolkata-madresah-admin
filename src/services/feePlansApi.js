import { API_BASE_URL } from '@/config/apiConfig'

async function parseJson(response) {
  const text = await response.text()
  try {
    return text ? JSON.parse(text) : null
  } catch {
    return null
  }
}

/**
 * Fee plans by academic year (POST).
 * Tries nested path first, then flat alias.
 */
export async function getFeePlansByYear(ayId, term = '') {
  const body = {}
  if (ayId) body.ay_id = Number(ayId)
  if (term) body.term = term

  const urls = [
    `${API_BASE_URL}/fees/plans/list.php`,
    `${API_BASE_URL}/fees/plans_list.php`,
  ]

  let lastError = 'Could not load fee plans.'

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(body),
      })
      const data = await parseJson(response)

      if (!data || typeof data !== 'object') {
        lastError = `Invalid response from fee plans API (HTTP ${response.status}).`
        continue
      }

      if (data.status != null) {
        if (!data.message) {
          data.message =
            Number(data.status) === 200
              ? 'OK'
              : `Could not load fee plans (status ${data.status}).`
        }
        return data
      }

      lastError = `Unexpected response from fee plans API (HTTP ${response.status}).`
    } catch (err) {
      lastError =
        err instanceof Error ? err.message : 'Network error loading fee plans.'
    }
  }

  return {
    status: 500,
    message: lastError,
    data: { plans: [] },
  }
}
