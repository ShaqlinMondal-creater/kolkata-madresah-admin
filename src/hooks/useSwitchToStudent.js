import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { setAuthUser } from '@/auth/authStorage'
import { switchToStudent } from '@/services/switchApi'

/**
 * Shared admin → student panel switch.
 * Returns { switching, switchError, doSwitch }
 */
export function useSwitchToStudent() {
  const navigate = useNavigate()
  const [switching, setSwitching] = useState(false)
  const [switchError, setSwitchError] = useState('')

  async function doSwitch(stId) {
    setSwitching(true)
    setSwitchError('')
    try {
      const res = await switchToStudent(stId)
      if (Number(res.status) === 200 && res.data?.userlevel) {
        setAuthUser({
          username: res.data.username,
          st_id: res.data.st_id,
          name: res.data.name,
          userlevel: res.data.userlevel,
          type: 'student',
          switched: true,
          prev_user: res.data.prev_user,
        })
        navigate('/student', { replace: true })
        return true
      }
      setSwitchError(res.message || 'Could not switch to student panel.')
      return false
    } catch {
      setSwitchError(
        'Switch API unavailable. Upload APIs/auth/switch_to_student.php',
      )
      return false
    } finally {
      setSwitching(false)
    }
  }

  return { switching, switchError, doSwitch, setSwitchError }
}
