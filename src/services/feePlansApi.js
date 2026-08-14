import { API_BASE_URL } from '@/config/apiConfig'
import { parseJson as parseJsonStrict, forceLogoutToHome } from '@/services/apiClient'
import { buildStudentsPayload } from '@/services/studentsApi'

async function parseJson(response) {
  try {
    return await parseJsonStrict(response)
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

/** Apply fee plan to selected students or filtered list */
export async function applyFeePlan({ stIds = [], filters = null, fpId }) {
  const body = {
    fp_id: Number(fpId),
  }
  const ids = Array.isArray(stIds)
    ? stIds.map(Number).filter((id) => id > 0)
    : []
  if (ids.length) {
    body.st_ids = ids
  } else if (filters) {
    const { page, perpage, ...rest } = filters
    body.filters = buildStudentsPayload(rest)
  }

  const response = await fetch(`${API_BASE_URL}/fees/apply_plan.php`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  })
  return parseJsonStrict(response)
}

/** Create fee plan for an academic year */
export async function createFeePlan(payload) {
  const response = await fetch(`${API_BASE_URL}/fees/plans/create.php`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      ay_id: Number(payload.ay_id),
      fp_name: payload.fp_name,
      fp_type: payload.fp_type,
      cg_ids: Array.isArray(payload.cg_ids)
        ? payload.cg_ids.map(Number).filter((id) => id > 0)
        : [],
    }),
  })

  const text = await response.text()
  if (!text || !String(text).trim()) {
    return {
      status: response.status || 500,
      message: `Empty response from create API (HTTP ${response.status}). Upload APIs/fees/plans/create.php and _helpers.php to cPanel.`,
      data: {},
    }
  }

  let data
  try {
    data = JSON.parse(text)
  } catch {
    return {
      status: response.status || 500,
      message: `Invalid JSON from create API (HTTP ${response.status}). Check PHP errors on server.`,
      data: {},
    }
  }

  if (
    response.status === 401 ||
    Number(data?.status) === 401 ||
    String(data?.message || '')
      .toLowerCase()
      .includes('unauthorized')
  ) {
    forceLogoutToHome(`${API_BASE_URL}/fees/plans/create.php`)
  }

  if (data && typeof data === 'object' && data.status == null && !data.message) {
    data.status = response.status || 500
    data.message = `Unexpected create API response (HTTP ${response.status}).`
  }

  return data
}

/** Update existing fee plan */
export async function updateFeePlan(payload) {
  const response = await fetch(`${API_BASE_URL}/fees/plans/update.php`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      fp_id: Number(payload.fp_id),
      ay_id: payload.ay_id ? Number(payload.ay_id) : undefined,
      fp_name: payload.fp_name,
      fp_type: payload.fp_type,
      cg_ids: Array.isArray(payload.cg_ids)
        ? payload.cg_ids.map(Number).filter((id) => id > 0)
        : [],
    }),
  })
  return parseJsonStrict(response)
}

/** List fee lines under a plan (fee_plan_period) */
export async function getFeePlanLines(fpId) {
  const response = await fetch(`${API_BASE_URL}/fees/plans/lines/list.php`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ fp_id: Number(fpId) }),
  })
  return parseJsonStrict(response)
}

/** Add fee line under a plan */
export async function createFeePlanLine(payload) {
  const response = await fetch(`${API_BASE_URL}/fees/plans/lines/create.php`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      fp_id: Number(payload.fp_id),
      name: payload.name,
      amount: payload.amount,
      due_date: payload.due_date,
      late_fee: payload.late_fee ?? 0,
    }),
  })
  return parseJsonStrict(response)
}

/** Update fee line */
export async function updateFeePlanLine(payload) {
  const response = await fetch(`${API_BASE_URL}/fees/plans/lines/update.php`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      fpp_id: Number(payload.fpp_id),
      name: payload.name,
      amount: payload.amount,
      due_date: payload.due_date,
      late_fee: payload.late_fee ?? 0,
    }),
  })
  return parseJsonStrict(response)
}
