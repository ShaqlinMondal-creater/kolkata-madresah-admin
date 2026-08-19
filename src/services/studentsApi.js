import { API_BASE_URL } from '@/config/apiConfig'
import { parseJson } from '@/services/apiClient'

/** Build POST body with only actively set filters */
export function buildStudentsPayload(filters = {}) {
  const body = {}

  const search = typeof filters.search === 'string' ? filters.search.trim() : ''
  if (search) body.search = search

  if (filters.st_on_roll === '0' || filters.st_on_roll === '1') {
    body.st_on_roll = filters.st_on_roll
  }

  if (filters.ay_id === 'all') {
    body.ay_id = 'all'
  } else if (
    filters.ay_id !== undefined &&
    filters.ay_id !== null &&
    filters.ay_id !== ''
  ) {
    body.ay_id = Number(filters.ay_id)
  }

  if (filters.st_bohra === '0' || filters.st_bohra === '1') {
    body.st_bohra = filters.st_bohra
  }

  const cgIds = Array.isArray(filters.cg_id)
    ? filters.cg_id.map(Number).filter((id) => id > 0)
    : filters.cg_id
      ? [Number(filters.cg_id)].filter((id) => id > 0)
      : []
  if (cgIds.length) body.cg_id = cgIds

  if (filters.st_gender === 'M' || filters.st_gender === 'F') {
    body.st_gender = filters.st_gender
  }

  if (filters.dob_from) body.dob_from = filters.dob_from
  if (filters.dob_to) body.dob_to = filters.dob_to

  if (filters.page) body.page = Number(filters.page)
  if (filters.perpage) body.perpage = Number(filters.perpage)

  return body
}

function buildActionPayload({ stIds, filters, extra = {} }) {
  const body = { ...extra }
  const ids = Array.isArray(stIds)
    ? stIds.map(Number).filter((id) => id > 0)
    : []
  if (ids.length) {
    body.st_ids = ids
  } else if (filters) {
    const { page, perpage, ...rest } = filters
    body.filters = buildStudentsPayload(rest)
  }
  return body
}

export async function getStudentsList(filters = {}) {
  const body = buildStudentsPayload(filters)

  const response = await fetch(`${API_BASE_URL}/students/list.php`, {
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

export async function getStudentDetails(stId) {
  const response = await fetch(`${API_BASE_URL}/students/details.php`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ st_id: Number(stId) }),
  })
  return parseJson(response)
}

/** Create student + parents (admin add student wizard) */
export async function createStudent(payload) {
  const response = await fetch(`${API_BASE_URL}/students/create.php`, {
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

/** Admin inline edit — single field on student / parents / address */
export async function updateStudentField(stId, field, value) {
  const response = await fetch(`${API_BASE_URL}/students/update.php`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      st_id: Number(stId),
      field,
      value: value ?? '',
    }),
  })
  return parseJson(response)
}

/** Upgrade student(s) to target class — blocks if unpaid fees in source year */
export async function upgradeStudents({
  stIds = [],
  filters = null,
  sourceAyId,
  targetCgId,
}) {
  const body = buildActionPayload({
    stIds,
    filters,
    extra: {
      source_ay_id: Number(sourceAyId),
      target_cg_id: Number(targetCgId),
    },
  })
  const response = await fetch(`${API_BASE_URL}/students/upgrade.php`, {
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

/** Change class within same academic year */
export async function changeStudentClass({
  stIds = [],
  filters = null,
  ayId,
  targetCgId,
}) {
  const body = buildActionPayload({
    stIds,
    filters,
    extra: {
      ay_id: Number(ayId),
      target_cg_id: Number(targetCgId),
    },
  })
  const response = await fetch(`${API_BASE_URL}/students/change_class.php`, {
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

/** Mark student off-roll (blocked if deposit or wallet has money) */
export async function offRollStudent(stId) {
  const response = await fetch(`${API_BASE_URL}/students/off_roll.php`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ st_id: Number(stId) }),
  })
  return parseJson(response)
}
