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
 * Fee plans by academic year.
 * Tries flat path first, then nested path (both are the same API).
 */
export async function getFeePlansByYear(ayId, term = '') {
  const params = new URLSearchParams()
  if (ayId) params.set('ay_id', String(ayId))
  if (term) params.set('term', term)
  const query = params.toString()
  const qs = query ? `?${query}` : ''

  const urls = [
    `${API_BASE_URL}/fees/plans/list.php${qs}`,
    `${API_BASE_URL}/fees/plans_list.php${qs}`,
  ]

  let lastError = 'Could not load fee plans.'

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
      })
      const data = await parseJson(response)

      if (!data || typeof data !== 'object') {
        lastError = `Invalid response from ${url} (HTTP ${response.status}). Re-upload the PHP file.`
        continue
      }

      // Valid API payload — return even if not 200 (UI shows message)
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
