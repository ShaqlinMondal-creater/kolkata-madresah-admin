import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import CheckOutlinedIcon from '@mui/icons-material/CheckOutlined'
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined'
import {
  getStudentDashboard,
  updateStudentProfile,
} from '@/services/studentPanelApi'
import { setAuthUser, getAuthUser } from '@/auth/authStorage'

function formatInr(amount) {
  return Number(amount || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  })
}

function InlineEditField({
  label,
  value,
  fieldKey,
  placeholder,
  inputMode = 'text',
  onSaved,
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value || '')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (!editing) setDraft(value || '')
  }, [value, editing])

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  async function save() {
    const next = String(draft).trim()
    const prev = String(value || '').trim()
    if (next === prev) {
      setEditing(false)
      setErr('')
      return
    }

    setSaving(true)
    setErr('')
    try {
      const res = await updateStudentProfile({ [fieldKey]: next })
      if (Number(res.status) === 200 && res.data) {
        onSaved?.(res.data)
        setEditing(false)
      } else {
        setErr(res.message || 'Could not save.')
      }
    } catch {
      setErr('Update API unavailable. Upload APIs/student-panel/update_profile.php')
    } finally {
      setSaving(false)
    }
  }

  function cancel() {
    setDraft(value || '')
    setErr('')
    setEditing(false)
  }

  return (
    <div className={`student-inline${editing ? ' is-editing' : ''}`}>
      <dt>{label}</dt>
      <dd>
        {editing ? (
          <div className="student-inline__edit">
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={placeholder}
              inputMode={inputMode}
              disabled={saving}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  save()
                }
                if (e.key === 'Escape') {
                  e.preventDefault()
                  cancel()
                }
              }}
            />
            <Tooltip title="Save">
              <span>
                <IconButton
                  size="small"
                  color="primary"
                  onClick={save}
                  disabled={saving}
                  aria-label={`Save ${label}`}
                >
                  {saving ? (
                    <CircularProgress size={16} />
                  ) : (
                    <CheckOutlinedIcon fontSize="small" />
                  )}
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Cancel">
              <span>
                <IconButton
                  size="small"
                  onClick={cancel}
                  disabled={saving}
                  aria-label={`Cancel ${label}`}
                >
                  <CloseOutlinedIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </div>
        ) : (
          <div className="student-inline__view">
            <strong>{value || '—'}</strong>
            <Tooltip title={`Edit ${label}`}>
              <IconButton
                size="small"
                className="student-inline__pen"
                onClick={() => setEditing(true)}
                aria-label={`Edit ${label}`}
              >
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </div>
        )}
        {err ? <p className="student-inline__error">{err}</p> : null}
      </dd>
    </div>
  )
}

export default function StudentDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState(null)

  useEffect(() => {
    let alive = true
    async function load() {
      setLoading(true)
      setError('')
      try {
        const res = await getStudentDashboard()
        if (!alive) return
        if (Number(res.status) === 200 && res.data?.student) {
          setData(res.data)
          const auth = getAuthUser() || {}
          setAuthUser({
            ...auth,
            st_id: res.data.student.st_id,
            name: res.data.student.name,
            username: res.data.student.roll_no || auth.username,
            switched: !!res.data.switched || !!auth.switched,
          })
        } else {
          setError(res.message || 'Could not load student dashboard.')
        }
      } catch {
        if (alive) {
          setError(
            'Student dashboard API unavailable. Upload APIs/student-panel/dashboard.php',
          )
        }
      } finally {
        if (alive) setLoading(false)
      }
    }
    load()
    return () => {
      alive = false
    }
  }, [])

  function applyProfilePatch(patch) {
    setData((prev) => {
      if (!prev?.student) return prev
      return {
        ...prev,
        student: {
          ...prev.student,
          its_id:
            patch.its_id !== undefined ? patch.its_id : prev.student.its_id,
          mobile:
            patch.mobile !== undefined ? patch.mobile : prev.student.mobile,
        },
      }
    })
  }

  const student = data?.student
  const summary = data?.summary
  const initial = (student?.name || 'S').trim().charAt(0).toUpperCase()

  return (
    <section className="module-page student-page">
      {loading ? (
        <div className="student-page__loading">
          <CircularProgress size={24} />
          Loading…
        </div>
      ) : error ? (
        <p className="student-page__error">{error}</p>
      ) : student ? (
        <>
          <header className="student-page__welcome">
            <div className="student-page__welcome-left">
              <div className="student-page__avatar" aria-hidden="true">
                {initial}
              </div>
              <div className="student-page__welcome-text">
                <h1 className="text-gold-gradient">Welcome {student.name}</h1>
                {student.class_name ? (
                  <p className="student-page__class-pill">{student.class_name}</p>
                ) : null}
              </div>
            </div>
            <div className="student-page__meta">
              <span>
                Roll <strong>{student.roll_no || '—'}</strong>
              </span>
              <span className="student-page__meta-sep" aria-hidden="true" />
              <span>
                Deposit <strong>₹{formatInr(student.deposit)}</strong>
              </span>
              <span className="student-page__meta-sep" aria-hidden="true" />
              <span>
                Wallet <strong>₹{formatInr(student.wallet)}</strong>
              </span>
            </div>
          </header>

          <div className="student-page__main-row">
            <section className="student-page__profile student-page__profile--stack">
              <h2>Profile summary</h2>
              <dl>
                <div>
                  <dt>Name</dt>
                  <dd>{student.name || '—'}</dd>
                </div>
                <div>
                  <dt>Academic Year</dt>
                  <dd>{student.ay_name || '—'}</dd>
                </div>
                <InlineEditField
                  label="ITS"
                  fieldKey="its_id"
                  value={student.its_id}
                  placeholder="Enter ITS ID"
                  inputMode="numeric"
                  onSaved={applyProfilePatch}
                />
                <InlineEditField
                  label="Mobile"
                  fieldKey="mobile"
                  value={student.mobile}
                  placeholder="Enter mobile number"
                  inputMode="tel"
                  onSaved={applyProfilePatch}
                />
              </dl>
            </section>

            <div className="student-page__cards student-page__cards--side">
              <Link
                to="/student/pending-fees"
                className="student-page__card student-page__card--pending"
              >
                <span>Pending Fees</span>
                <strong>{summary?.pending_count ?? 0}</strong>
                <em>₹{formatInr(summary?.pending_total)}</em>
              </Link>
              <Link
                to="/student/paid-fees"
                className="student-page__card student-page__card--paid"
              >
                <span>Paid Fees</span>
                <strong>{summary?.paid_count ?? 0}</strong>
                <em>View history</em>
              </Link>
              <Link
                to="/student/transactions"
                className="student-page__card student-page__card--txn"
              >
                <span>Transactions</span>
                <strong>Ledger</strong>
                <em>Payments & transfers</em>
              </Link>
            </div>
          </div>
        </>
      ) : null}
    </section>
  )
}
