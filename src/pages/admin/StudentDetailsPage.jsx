import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import CircularProgress from '@mui/material/CircularProgress'
import Collapse from '@mui/material/Collapse'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Snackbar from '@mui/material/Snackbar'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Tooltip from '@mui/material/Tooltip'
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import CheckOutlinedIcon from '@mui/icons-material/CheckOutlined'
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined'
import LoginIcon from '@mui/icons-material/Login'
import PersonOffOutlinedIcon from '@mui/icons-material/PersonOffOutlined'
import SwapHorizOutlinedIcon from '@mui/icons-material/SwapHorizOutlined'
import { getFeesList } from '@/services/feesApi'
import {
  getStudentDetails,
  updateStudentField,
  offRollStudent,
} from '@/services/studentsApi'
import { useSwitchToStudent } from '@/hooks/useSwitchToStudent'
import {
  formatPayAmount,
  isMonthlyFeeEnabled,
  normalizeFeeForSelection,
  sortFeesForPayment,
  sumSelectedFees,
  toggleFeeSelection,
} from '@/utils/feeSelection'

const ADMIN_PAYMENT_METHODS = [
  {
    id: 'online',
    label: 'Online',
    hint: 'Pay online via Razorpay (card, net banking, UPI, etc.).',
  },
  {
    id: 'cash',
    label: 'Cash',
    hint: 'Record cash payment for this student.',
  },
  {
    id: 'upi',
    label: 'UPI',
    hint: 'Record / collect via UPI.',
  },
]

function formatInr(amount) {
  return Number(amount || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  })
}

function dash(value) {
  if (value === null || value === undefined) return '—'
  const text = String(value).trim()
  return text !== '' ? text : '—'
}

function formatDobInput(value) {
  let digits = String(value ?? '').replace(/\D+/g, '').slice(0, 8)

  // Clamp day (positions 0-1)
  if (digits.length >= 1) {
    const d0 = Number(digits[0])
    if (d0 > 3) digits = '0' + d0 + digits.slice(2)
  }
  if (digits.length >= 2) {
    const day = Number(digits.slice(0, 2))
    if (day === 0) digits = '01' + digits.slice(2)
    else if (day > 31) digits = '31' + digits.slice(2)
  }

  // Clamp month (positions 2-3)
  if (digits.length >= 3) {
    const m0 = Number(digits[2])
    if (m0 > 1) digits = digits.slice(0, 2) + '0' + m0 + digits.slice(4)
  }
  if (digits.length >= 4) {
    const month = Number(digits.slice(2, 4))
    if (month === 0) digits = digits.slice(0, 2) + '01' + digits.slice(4)
    else if (month > 12) digits = digits.slice(0, 2) + '12' + digits.slice(4)
  }

  // Clamp year first digit (positions 4): only 1 or 2
  if (digits.length >= 5) {
    const y0 = Number(digits[4])
    if (y0 !== 1 && y0 !== 2) digits = digits.slice(0, 4) + '2' + digits.slice(5)
  }

  digits = digits.slice(0, 8)

  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}-${digits.slice(2)}`
  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`
}

function isValidDob(str) {
  const m = String(str || '').match(/^(\d{2})-(\d{2})-(\d{4})$/)
  if (!m) return false
  const day = Number(m[1])
  const month = Number(m[2])
  const year = Number(m[3])
  if (month < 1 || month > 12) return false
  if (day < 1 || day > 31) return false
  if (year < 1920 || year > new Date().getFullYear()) return false
  const d = new Date(year, month - 1, day)
  return (
    d.getFullYear() === year &&
    d.getMonth() === month - 1 &&
    d.getDate() === day
  )
}

const FATHER_OCC = [
  { value: 'self-employed', label: 'Self Employed' },
  { value: 'employed', label: 'Employed' },
  { value: 'none', label: 'None' },
]

const MOTHER_OCC = [
  { value: 'self-employed', label: 'Self Employed' },
  { value: 'employed', label: 'Employed' },
  { value: 'homemaker', label: 'Home-Maker' },
]

const GENDER_OPTS = [
  { value: '', label: '—' },
  { value: 'M', label: 'Male' },
  { value: 'F', label: 'Female' },
]

const YES_NO = [
  { value: '1', label: 'Yes' },
  { value: '0', label: 'No' },
]

function InlineField({
  label,
  value,
  fieldKey,
  stId,
  onSaved,
  type = 'text',
  options = null,
  placeholder = '',
  displayValue = null,
  inputMode = 'text',
  formatDraft = null,
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value ?? '')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (!editing) setDraft(value ?? '')
  }, [value, editing])

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      if (inputRef.current.select && type !== 'select') {
        inputRef.current.select()
      }
    }
  }, [editing, type])

  async function save() {
    const next = String(draft ?? '').trim()
    const prev = String(value ?? '').trim()
    if (next === prev) {
      setEditing(false)
      setErr('')
      return
    }

    if (fieldKey === 'dob' && next !== '' && !isValidDob(next)) {
      setErr('Enter a valid date (DD-MM-YYYY).')
      return
    }

    setSaving(true)
    setErr('')
    try {
      const res = await updateStudentField(stId, fieldKey, next)
      if (Number(res.status) === 200) {
        await onSaved?.()
        setEditing(false)
      } else {
        setErr(res.message || 'Could not save.')
      }
    } catch {
      setErr('Update failed. Upload APIs/students/update.php')
    } finally {
      setSaving(false)
    }
  }

  function cancel() {
    setDraft(value ?? '')
    setErr('')
    setEditing(false)
  }

  const shown = displayValue != null ? displayValue : value

  return (
    <div className={`st-inline${editing ? ' is-editing' : ''}${!shown || String(shown).trim() === '' ? ' is-empty' : ''}`}>
      <div className="st-inline__top">
        <span className="st-inline__label">{label}</span>
        {!editing ? (
          <Tooltip title={`Edit ${label}`}>
            <IconButton
              size="small"
              className="st-inline__pen"
              onClick={() => setEditing(true)}
              aria-label={`Edit ${label}`}
            >
              <EditOutlinedIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
        ) : null}
      </div>
      {editing ? (
        <div className="st-inline__edit">
          <div className="st-inline__control">
            {type === 'select' ? (
              <select
                ref={inputRef}
                value={draft}
                disabled={saving}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.preventDefault()
                    cancel()
                  }
                }}
              >
                {options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) =>
                  setDraft(formatDraft ? formatDraft(e.target.value) : e.target.value)
                }
                placeholder={placeholder || 'Type here…'}
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
            )}
          </div>
          <div className="st-inline__actions">
            <Tooltip title="Save">
              <span>
                <button
                  type="button"
                  className="st-inline__btn st-inline__btn--save"
                  onClick={save}
                  disabled={saving}
                  aria-label={`Save ${label}`}
                >
                  {saving ? (
                    <CircularProgress size={14} color="inherit" />
                  ) : (
                    <CheckOutlinedIcon fontSize="inherit" />
                  )}
                </button>
              </span>
            </Tooltip>
            <Tooltip title="Cancel">
              <span>
                <button
                  type="button"
                  className="st-inline__btn st-inline__btn--cancel"
                  onClick={cancel}
                  disabled={saving}
                  aria-label={`Cancel ${label}`}
                >
                  <CloseOutlinedIcon fontSize="inherit" />
                </button>
              </span>
            </Tooltip>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="st-inline__value"
          onClick={() => setEditing(true)}
        >
          <strong>{dash(shown)}</strong>
        </button>
      )}
      {err ? <p className="st-inline__error">{err}</p> : null}
    </div>
  )
}

function DetailSection({ title, hint, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section className={`st-detail__card${open ? ' is-open' : ''}`}>
      <button
        type="button"
        className="st-detail__card-head st-detail__card-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div>
          <h2>{title}</h2>
          {hint ? <p>{hint}</p> : null}
        </div>
        <span className={`st-detail__chevron${open ? ' is-open' : ''}`} aria-hidden>
          <ExpandMoreOutlinedIcon fontSize="small" />
        </span>
      </button>
      <Collapse in={open} timeout="auto">
        <div className="st-detail__grid">{children}</div>
      </Collapse>
    </section>
  )
}

function StudentFeesTab({ student, status }) {
  const isPaid = status === 'paid'
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [fees, setFees] = useState([])
  const [ayName, setAyName] = useState('')
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [payMethod, setPayMethod] = useState('online')
  const [methodAnchor, setMethodAnchor] = useState(null)
  const [payHint, setPayHint] = useState('')

  const displayFees = useMemo(
    () => sortFeesForPayment(fees.map(normalizeFeeForSelection)),
    [fees],
  )

  const selectedTotal = useMemo(
    () => sumSelectedFees(displayFees, selectedIds),
    [displayFees, selectedIds],
  )

  const selectedMethod =
    ADMIN_PAYMENT_METHODS.find((item) => item.id === payMethod) ||
    ADMIN_PAYMENT_METHODS[0]

  useEffect(() => {
    setSelectedIds(new Set())
  }, [status, fees])

  useEffect(() => {
    let alive = true
    async function load() {
      if (!student?.roll_no && !student?.st_id) {
        setFees([])
        setLoading(false)
        return
      }
      setLoading(true)
      setError('')
      try {
        const res = await getFeesList({
          search: student.roll_no || '',
          status,
          ay_id: student.ay_id || undefined,
          page: 1,
          perpage: 100,
        })
        if (!alive) return
        if (Number(res.status) === 200 && res.data) {
          const rows = (res.data.fees || []).filter(
            (row) => Number(row.st_id) === Number(student.st_id),
          )
          setFees(rows)
          setAyName(res.data.ay_name || student.ay_name || '')
        } else {
          setFees([])
          setError(res.message || 'Could not load fees.')
        }
      } catch {
        if (alive) {
          setFees([])
          setError('Fees API unavailable. Upload APIs/fees/list.php')
        }
      } finally {
        if (alive) setLoading(false)
      }
    }
    load()
    return () => {
      alive = false
    }
  }, [student?.st_id, student?.roll_no, student?.ay_id, student?.ay_name, status])

  function handleToggleFee(fId) {
    setSelectedIds((prev) => toggleFeeSelection(displayFees, prev, fId))
  }

  function handlePayClick() {
    if (selectedIds.size === 0) return
    setPayHint(
      `${selectedMethod.label} payment for ₹${formatPayAmount(selectedTotal)}/- will be connected in the next step.`,
    )
  }

  return (
    <section className="st-detail__card st-detail-fees">
      <header className="st-detail__card-head">
        <div>
          <h2>{isPaid ? 'Paid Fees' : 'Pending Fees'}</h2>
          <p>
            {fees.length} record(s)
            {ayName ? ` · ${ayName}` : ''}
            {' · filtered by roll + academic year'}
          </p>
        </div>
      </header>

      {loading ? (
        <div className="st-detail-page__loading">
          <CircularProgress size={22} />
          Loading fees…
        </div>
      ) : error ? (
        <p className="st-detail-page__error">{error}</p>
      ) : fees.length === 0 ? (
        <p className="st-detail-page__empty">
          No {isPaid ? 'paid' : 'pending'} fees for this student.
        </p>
      ) : (
        <div className="st-detail-fees__wrap">
          <table className="st-detail-fees__table">
            <thead>
              <tr>
                {!isPaid ? (
                  <th className="st-detail-fees__check" aria-label="Select" />
                ) : null}
                <th>Fee</th>
                <th>Amount</th>
                {!isPaid ? <th>Due date</th> : <th>Paid date</th>}
                <th>Late fee</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {displayFees.map((fee) => {
                const checked = selectedIds.has(fee.f_id)
                const monthlyEnabled =
                  !fee.is_monthly ||
                  isMonthlyFeeEnabled(displayFees, selectedIds, fee.f_id)

                return (
                  <tr
                    key={fee.f_id}
                    className={
                      !isPaid && fee.is_monthly && !monthlyEnabled
                        ? 'st-detail-fees__row--locked'
                        : undefined
                    }
                  >
                    {!isPaid ? (
                      <td className="st-detail-fees__check">
                        <Checkbox
                          size="small"
                          checked={checked}
                          disabled={!monthlyEnabled}
                          onChange={() => handleToggleFee(fee.f_id)}
                          inputProps={{
                            'aria-label': `Select ${fee.fpp_name || 'fee'}`,
                          }}
                          sx={{
                            color: '#8a6b2a',
                            '&.Mui-checked': { color: '#245c45' },
                            '&.Mui-disabled': { opacity: 0.45 },
                          }}
                        />
                      </td>
                    ) : null}
                    <td>{fee.fpp_name || '—'}</td>
                    <td>₹{formatInr(fee.fee_amount_net ?? fee.fpp_amount)}</td>
                    <td>
                      {isPaid
                        ? fee.f_paid_date || '—'
                        : fee.fpp_due_date || '—'}
                    </td>
                    <td>₹{formatInr(fee.late_fee_applicable)}</td>
                    <td>
                      <strong>₹{formatInr(fee.total)}</strong>
                    </td>
                    <td>
                      <span
                        className={`st-detail-fees__pill st-detail-fees__pill--${fee.status || status}`}
                      >
                        {fee.status_label || (isPaid ? 'Paid' : 'Pending')}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {!isPaid ? (
            <div className="student-fees-paybar st-detail-fees__paybar">
              <p className="student-fees-paybar__hint">
                {selectedIds.size > 0
                  ? `${selectedIds.size} fee(s) · ${selectedMethod.label} · monthly fees must be paid in order`
                  : 'Select fees · choose Through method · pay earlier months first'}
              </p>
              <div className="student-fees-paybar__actions">
                <Button
                  variant="outlined"
                  className="student-fees-paybar__method-btn"
                  disabled={selectedIds.size === 0}
                  onClick={(e) => setMethodAnchor(e.currentTarget)}
                  endIcon={<ArrowDropDownIcon />}
                >
                  Through: {selectedMethod.label}
                </Button>
                <Menu
                  anchorEl={methodAnchor}
                  open={Boolean(methodAnchor)}
                  onClose={() => setMethodAnchor(null)}
                  anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                >
                  {ADMIN_PAYMENT_METHODS.map((item) => (
                    <MenuItem
                      key={item.id}
                      selected={payMethod === item.id}
                      onClick={() => {
                        setPayMethod(item.id)
                        setMethodAnchor(null)
                      }}
                    >
                      <span className="student-fees-paybar__method-option">
                        <strong>{item.label}</strong>
                        <small>{item.hint}</small>
                      </span>
                    </MenuItem>
                  ))}
                </Menu>
                <Button
                  variant="contained"
                  className="student-fees-paybar__btn"
                  disabled={selectedIds.size === 0}
                  onClick={handlePayClick}
                >
                  PAY {formatPayAmount(selectedTotal)}/-
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      <Snackbar
        open={Boolean(payHint)}
        autoHideDuration={4000}
        onClose={() => setPayHint('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="info" onClose={() => setPayHint('')} sx={{ width: '100%' }}>
          {payHint}
        </Alert>
      </Snackbar>
    </section>
  )
}

export default function StudentDetailsPage() {
  const { stId } = useParams()
  const navigate = useNavigate()
  const { switching, doSwitch } = useSwitchToStudent()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [student, setStudent] = useState(null)
  const [switchMsg, setSwitchMsg] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [tab, setTab] = useState('details')
  const [toast, setToast] = useState({ open: false, message: '', severity: 'info' })
  const [offRollOpen, setOffRollOpen] = useState(false)
  const [offRolling, setOffRolling] = useState(false)

  function showComingSoon(label) {
    setToast({ open: true, message: `${label} is coming soon.`, severity: 'info' })
  }

  function showToast(message, severity = 'info') {
    setToast({ open: true, message, severity })
  }

  async function load(showSpinner = true) {
    if (showSpinner) setLoading(true)
    else setRefreshing(true)
    setError('')
    try {
      const res = await getStudentDetails(stId)
      if (Number(res.status) === 200 && res.data?.student) {
        setStudent(res.data.student)
      } else {
        setStudent(null)
        setError(res.message || 'Could not load student details.')
      }
    } catch {
      setStudent(null)
      setError(
        'Student details API is unavailable. Upload APIs/students/details.php',
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    load(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stId])

  const refresh = () => load(false)

  const fatherOccValue = (() => {
    const raw = String(student?.father?.occupation || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
    if (['self-employed', 'employed', 'none'].includes(raw)) return raw
    if (raw.includes('self')) return 'self-employed'
    if (raw.includes('employ')) return 'employed'
    if (raw === '' || raw === '—') return 'none'
    return raw || 'none'
  })()

  const motherOccValue = (() => {
    const raw = String(student?.mother?.occupation || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
    if (['self-employed', 'employed', 'homemaker'].includes(raw)) return raw
    if (raw.includes('self')) return 'self-employed'
    if (raw.includes('employ')) return 'employed'
    if (raw.includes('home')) return 'homemaker'
    return raw || 'homemaker'
  })()

  return (
    <section className="module-page st-detail-page">
      <header className="st-detail-page__head">
        <div className="st-detail-page__title">
          <Button
            size="small"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/students')}
            className="st-detail-page__back"
          >
            Back to Students
          </Button>
          <h1 className="text-gold-gradient">Student Details</h1>
        </div>

        <div className="st-detail-page__actions">
          {student ? (
            <div className="st-detail-page__wallet">
              Deposit: <strong>₹{formatInr(student.deposit)}</strong>
              <span>|</span>
              Wallet: <strong>₹{formatInr(student.wallet)}</strong>
            </div>
          ) : null}
          <Button
            variant="contained"
            size="small"
            startIcon={<LoginIcon />}
            disabled={!student || switching}
            onClick={async () => {
              setSwitchMsg('')
              const ok = await doSwitch(student.st_id)
              if (!ok) {
                setSwitchMsg(
                  'Could not open student panel. Upload APIs/auth/switch_to_student.php',
                )
              }
            }}
          >
            {switching ? 'Switching…' : 'Login as Student'}
          </Button>
        </div>
      </header>

      {switchMsg ? <p className="st-detail-page__error">{switchMsg}</p> : null}

      {loading ? (
        <div className="st-detail-page__loading">
          <CircularProgress size={26} />
          Loading student details…
        </div>
      ) : error ? (
        <p className="st-detail-page__error">
          {error}{' '}
          <Link to="/students" className="st-detail-page__link">
            Return to list
          </Link>
        </p>
      ) : student ? (
        <div className="st-detail-page__body">
          <div className="st-detail-hero">
            <div className="st-detail-hero__mark" aria-hidden>
              {(student.name || '?').trim().charAt(0).toUpperCase()}
            </div>
            <div className="st-detail-hero__copy">
              <h2>{student.name || 'Unnamed student'}</h2>
              <p>
                {student.roll_no ? `Roll ${student.roll_no}` : 'No roll no'}
                {student.class_name ? ` · ${student.class_name}` : ''}
                {student.ay_name ? ` · ${student.ay_name}` : ''}
              </p>
              <div className="st-detail-hero__chips">
                <span
                  className={`st-chip ${student.is_bohra ? 'is-on' : 'is-off'}`}
                >
                  {student.is_bohra ? 'Bohra' : 'Non Bohra'}
                </span>
                <span
                  className={`st-chip ${student.on_roll ? 'is-on' : 'is-muted'}`}
                >
                  {student.on_roll ? 'On-roll' : 'Off-roll'}
                </span>
                {refreshing ? (
                  <span className="st-chip is-soft">Saving…</span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="st-detail-toolbar">
            <Tabs
              value={tab}
              onChange={(_, next) => setTab(next)}
              className="st-detail-tabs"
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab value="details" label="Details" />
              <Tab value="pending" label="Pending Fees" />
              <Tab value="paid" label="Paid Fees" />
            </Tabs>

            <div className="st-detail-toolbar__actions">
              <Button
                size="small"
                variant="outlined"
                startIcon={<SwapHorizOutlinedIcon />}
                onClick={() => showComingSoon('Transfer money')}
              >
                Transfer money
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<AccountBalanceWalletOutlinedIcon />}
                onClick={() => showComingSoon('Add money to wallet')}
              >
                Add money to wallet
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="warning"
                startIcon={<PersonOffOutlinedIcon />}
                disabled={!student.on_roll || refreshing || offRolling}
                onClick={() => setOffRollOpen(true)}
              >
                {student.on_roll ? 'Off Roll student' : 'Already off-roll'}
              </Button>
            </div>
          </div>

          {tab === 'details' ? (
            <>
          <DetailSection
            title="Student Details"
            hint="Click the pen to edit a field · Enter to save · Esc to cancel"
            defaultOpen
          >
            <InlineField
              label="Bohra"
              value={student.st_bohra === '1' ? '1' : '0'}
              displayValue={student.is_bohra ? 'Yes' : 'No'}
              fieldKey="st_bohra"
              stId={student.st_id}
              onSaved={refresh}
              type="select"
              options={YES_NO}
            />
            <InlineField
              label="On-roll"
              value={student.st_on_roll === '1' ? '1' : '0'}
              displayValue={student.on_roll ? 'Yes' : 'No'}
              fieldKey="st_on_roll"
              stId={student.st_id}
              onSaved={refresh}
              type="select"
              options={YES_NO}
            />
            <InlineField
              label="Gender"
              value={student.gender_code || ''}
              displayValue={student.gender}
              fieldKey="gender_code"
              stId={student.st_id}
              onSaved={refresh}
              type="select"
              options={GENDER_OPTS}
            />
            <InlineField
              label="D.O.B"
              value={student.dob}
              fieldKey="dob"
              stId={student.st_id}
              onSaved={refresh}
              placeholder="DD-MM-YYYY"
              inputMode="numeric"
              formatDraft={formatDobInput}
            />
            <InlineField
              label="Mobile No"
              value={student.mobile}
              fieldKey="mobile"
              stId={student.st_id}
              onSaved={refresh}
              inputMode="tel"
            />
            <InlineField
              label="Email"
              value={student.email}
              fieldKey="email"
              stId={student.st_id}
              onSaved={refresh}
              inputMode="email"
            />
            <InlineField
              label="ITS"
              value={student.its_id}
              fieldKey="its_id"
              stId={student.st_id}
              onSaved={refresh}
            />
            <InlineField
              label="Blood Group"
              value={student.blood_group}
              fieldKey="blood_group"
              stId={student.st_id}
              onSaved={refresh}
              placeholder="e.g. B+"
            />
            <InlineField
              label="Aadhaar No"
              value={student.aadhaar}
              fieldKey="aadhaar"
              stId={student.st_id}
              onSaved={refresh}
              inputMode="numeric"
            />
            <InlineField
              label="Address Line 1"
              value={student.address?.line1}
              fieldKey="address.line1"
              stId={student.st_id}
              onSaved={refresh}
            />
            <InlineField
              label="Address Line 2"
              value={student.address?.line2}
              fieldKey="address.line2"
              stId={student.st_id}
              onSaved={refresh}
            />
            <InlineField
              label="City"
              value={student.address?.city}
              fieldKey="address.city"
              stId={student.st_id}
              onSaved={refresh}
            />
            <InlineField
              label="State"
              value={student.address?.state}
              fieldKey="address.state"
              stId={student.st_id}
              onSaved={refresh}
            />
            <InlineField
              label="Country"
              value={student.address?.country}
              fieldKey="address.country"
              stId={student.st_id}
              onSaved={refresh}
            />
            <InlineField
              label="Pincode"
              value={student.address?.pincode}
              fieldKey="address.pincode"
              stId={student.st_id}
              onSaved={refresh}
              inputMode="numeric"
            />
          </DetailSection>

          <DetailSection title="Father Details" hint="Inline edit · auto-saved">
            <InlineField
              label="Name"
              value={student.father?.name}
              fieldKey="father.name"
              stId={student.st_id}
              onSaved={refresh}
              placeholder="First Last"
            />
            <InlineField
              label="Mobile No"
              value={student.father?.mobile}
              fieldKey="father.mobile"
              stId={student.st_id}
              onSaved={refresh}
              inputMode="tel"
            />
            <InlineField
              label="Email"
              value={student.father?.email}
              fieldKey="father.email"
              stId={student.st_id}
              onSaved={refresh}
              inputMode="email"
            />
            <InlineField
              label="Occupation"
              value={fatherOccValue}
              displayValue={student.father?.occupation || '—'}
              fieldKey="father.occupation"
              stId={student.st_id}
              onSaved={refresh}
              type="select"
              options={FATHER_OCC}
            />
            <InlineField
              label="Business / Employer"
              value={student.father?.employer_or_business}
              fieldKey="father.employer_or_business"
              stId={student.st_id}
              onSaved={refresh}
            />
            <InlineField
              label="Nature / Designation"
              value={student.father?.nature_or_designation}
              fieldKey="father.nature_or_designation"
              stId={student.st_id}
              onSaved={refresh}
            />
            <InlineField
              label="Address Line 1"
              value={student.father?.address_line1}
              fieldKey="father.address_line1"
              stId={student.st_id}
              onSaved={refresh}
            />
            <InlineField
              label="Address Line 2"
              value={student.father?.address_line2}
              fieldKey="father.address_line2"
              stId={student.st_id}
              onSaved={refresh}
            />
            <InlineField
              label="City"
              value={student.father?.city}
              fieldKey="father.city"
              stId={student.st_id}
              onSaved={refresh}
            />
            <InlineField
              label="State"
              value={student.father?.state}
              fieldKey="father.state"
              stId={student.st_id}
              onSaved={refresh}
            />
            <InlineField
              label="Country"
              value={student.father?.country}
              fieldKey="father.country"
              stId={student.st_id}
              onSaved={refresh}
            />
            <InlineField
              label="Pincode"
              value={student.father?.pincode}
              fieldKey="father.pincode"
              stId={student.st_id}
              onSaved={refresh}
              inputMode="numeric"
            />
          </DetailSection>

          <DetailSection title="Mother Details" hint="Inline edit · auto-saved">
            <InlineField
              label="Name"
              value={student.mother?.name}
              fieldKey="mother.name"
              stId={student.st_id}
              onSaved={refresh}
              placeholder="First Last"
            />
            <InlineField
              label="Mobile No"
              value={student.mother?.mobile}
              fieldKey="mother.mobile"
              stId={student.st_id}
              onSaved={refresh}
              inputMode="tel"
            />
            <InlineField
              label="Email"
              value={student.mother?.email}
              fieldKey="mother.email"
              stId={student.st_id}
              onSaved={refresh}
              inputMode="email"
            />
            <InlineField
              label="Occupation"
              value={motherOccValue}
              displayValue={student.mother?.occupation || '—'}
              fieldKey="mother.occupation"
              stId={student.st_id}
              onSaved={refresh}
              type="select"
              options={MOTHER_OCC}
            />
            <InlineField
              label="Business / Employer"
              value={student.mother?.employer_or_business}
              fieldKey="mother.employer_or_business"
              stId={student.st_id}
              onSaved={refresh}
            />
            <InlineField
              label="Nature / Designation"
              value={student.mother?.nature_or_designation}
              fieldKey="mother.nature_or_designation"
              stId={student.st_id}
              onSaved={refresh}
            />
            <InlineField
              label="Address Line 1"
              value={student.mother?.address_line1}
              fieldKey="mother.address_line1"
              stId={student.st_id}
              onSaved={refresh}
            />
            <InlineField
              label="Address Line 2"
              value={student.mother?.address_line2}
              fieldKey="mother.address_line2"
              stId={student.st_id}
              onSaved={refresh}
            />
            <InlineField
              label="City"
              value={student.mother?.city}
              fieldKey="mother.city"
              stId={student.st_id}
              onSaved={refresh}
            />
            <InlineField
              label="State"
              value={student.mother?.state}
              fieldKey="mother.state"
              stId={student.st_id}
              onSaved={refresh}
            />
            <InlineField
              label="Country"
              value={student.mother?.country}
              fieldKey="mother.country"
              stId={student.st_id}
              onSaved={refresh}
            />
            <InlineField
              label="Pincode"
              value={student.mother?.pincode}
              fieldKey="mother.pincode"
              stId={student.st_id}
              onSaved={refresh}
              inputMode="numeric"
            />
          </DetailSection>
            </>
          ) : null}

          {tab === 'pending' ? (
            <StudentFeesTab student={student} status="pending" />
          ) : null}

          {tab === 'paid' ? (
            <StudentFeesTab student={student} status="paid" />
          ) : null}
        </div>
      ) : null}

      <Dialog
        open={offRollOpen}
        onClose={offRolling ? undefined : () => setOffRollOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Off Roll student</DialogTitle>
        <DialogContent>
          <p style={{ margin: '0.5rem 0 0' }}>
            Mark <strong>{student?.name || 'this student'}</strong> off-roll?
          </p>
          <p style={{ margin: '0.65rem 0 0', color: 'var(--ink-soft)' }}>
            They will not be able to log in to the student panel. Payments stay
            mapped. Admin can still open their panel.
          </p>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOffRollOpen(false)} disabled={offRolling}>
            Cancel
          </Button>
          <Button
            color="warning"
            variant="contained"
            disabled={offRolling}
            onClick={async () => {
              setOffRolling(true)
              try {
                const res = await offRollStudent(student.st_id)
                if (Number(res.status) === 200) {
                  setOffRollOpen(false)
                  showToast(res.message || 'Student marked off-roll.', 'success')
                  await refresh()
                } else {
                  showToast(res.message || 'Could not mark off-roll.', 'error')
                }
              } catch {
                showToast(
                  'Off-roll API unavailable. Upload APIs/students/off_roll.php',
                  'error',
                )
              } finally {
                setOffRolling(false)
              }
            }}
          >
            {offRolling ? 'Saving…' : 'Mark off-roll'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={3200}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={toast.severity || 'info'}
          variant="filled"
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </section>
  )
}
