import { API_BASE_URL } from '@/config/apiConfig'
import { parseJson } from '@/services/apiClient'

export async function switchToStudent(stId) {
  const response = await fetch(`${API_BASE_URL}/auth/switch_to_student.php`, {
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

export async function switchBackAdmin() {
  const response = await fetch(`${API_BASE_URL}/auth/switch_back_admin.php`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({}),
  })
  return parseJson(response)
}
