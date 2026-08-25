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
import TextField from '@mui/material/TextField'
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
import { adminAddToWallet, adminPayFees } from '@/services/paymentsApi'
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
import { formatDobInput, isValidDob } from '@/utils/dobInput'
import { usePincodeLookup } from '@/hooks/usePincodeLookup'

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
  optional = false,
  /** When set, 6-digit PIN auto-fills these related update field keys */
  pincodeFill = null,
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value ?? '')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const inputRef = useRef(null)
  const isPincodeField = Boolean(pincodeFill) || String(fieldKey).endsWith('.pincode') || fieldKey === 'pincode'

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

  const { loading: pinLoading, error: pinError } = usePincodeLookup(
    editing && pincodeFill ? draft : '',
    async (result) => {
      if (!pincodeFill || !stId) return
      try {
        const updates = [
          [pincodeFill.city, result.city],
          [pincodeFill.state, result.state],
          [pincodeFill.country, result.country],
        ]
        for (const [key, val] of updates) {
          if (!key || !val) continue
          await updateStudentField(stId, key, val)
        }
        await onSaved?.()
      } catch {
        // keep typing; user can still edit city/state manually
      }
    },
  )

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
  const shownError = err || (editing && pinError ? pinError : '')

  return (
    <div className={`st-inline${editing ? ' is-editing' : ''}${!shown || String(shown).trim() === '' ? ' is-empty' : ''}`}>
      <div className="st-inline__top">
        <span className="st-inline__label">
          {label}
          {optional ? <span className="st-inline__optional">optional</span> : null}
        </span>
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
                onChange={(e) => {
                  let next = formatDraft
                    ? formatDraft(e.target.value)
                    : e.target.value
                  if (isPincodeField) {
                    next = String(next).replace(/\D+/g, '').slice(0, 6)
                  }
                  setDraft(next)
                }}
                placeholder={placeholder || (isPincodeField ? '6-digit PIN' : 'Type here…')}
                inputMode={isPincodeField ? 'numeric' : inputMode}
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
                  disabled={saving || pinLoading}
                  aria-label={`Save ${label}`}
                >
                  {saving || pinLoading ? (
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
      {shownError ? <p className="st-inline__error">{shownError}</p> : null}
      {editing && pinLoading ? (
        <p className="st-inline__hint">Looking up city / state…</p>
      ) : null}
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

function StudentFeesTab({ student, status, onPaid }) {
  const isPaid = status === 'paid'
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [fees, setFees] = useState([])
  const [ayName, setAyName] = useState('')
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [payMethod, setPayMethod] = useState('online')
  const [methodAnchor, setMethodAnchor] = useState(null)
  const [payHint, setPayHint] = useState('')
  const [paySeverity, setPaySeverity] = useState('info')
  const [paying, setPaying] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [payDialogOpen, setPayDialogOpen] = useState(false)
  const [receiptNo, setReceiptNo] = useState('')
  const [refNo, setRefNo] = useState('')
  const [remarks, setRemarks] = useState('')

  const displayFees = useMemo(
    () => sortFeesForPayment(fees.map(normalizeFeeForSelection)),
    [fees],
  )

  const selectedTotal = useMemo(
    () => sumSelectedFees(displayFees, selectedIds),
    [displayFees, selectedIds],
  )

  const wallet = Number(student?.wallet || 0)
  const shortfall = Math.max(0, round2(selectedTotal - wallet))

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
  }, [
    student?.st_id,
    student?.roll_no,
    student?.ay_id,
    student?.ay_name,
    status,
    reloadKey,
  ])

  function handleToggleFee(fId) {
    setSelectedIds((prev) => toggleFeeSelection(displayFees, prev, fId))
  }

  function resetPayForm() {
    setReceiptNo('')
    setRefNo('')
    setRemarks('')
  }

  function handlePayClick() {
    if (selectedIds.size === 0 || paying) return
    if (
      (payMethod === 'cash' || payMethod === 'upi') &&
      shortfall > 0
    ) {
      setPayDialogOpen(true)
      return
    }
    void submitPay({})
  }

  async function submitPay(extra = {}) {
    if (selectedIds.size === 0 || paying) return
    setPaying(true)
    setPayHint('')
    try {
      const res = await adminPayFees({
        st_id: Number(student.st_id),
        f_ids: [...selectedIds],
        method: payMethod,
        ...extra,
      })
      const statusCode = Number(res.status)
      if (statusCode === 200) {
        setPayDialogOpen(false)
        resetPayForm()
        setPaySeverity('success')
        setPayHint(
          res.message ||
            `Paid ₹${formatPayAmount(res.data?.paid_total ?? selectedTotal)}/-`,
        )
        setSelectedIds(new Set())
        setReloadKey((k) => k + 1)
        onPaid?.(res.data)
      } else if (statusCode === 501 || res.data?.needs_gateway) {
        setPaySeverity('info')
        setPayHint(
          res.message ||
            `Shortfall ₹${formatPayAmount(res.data?.shortfall)}/- — Online (Razorpay) comes next.`,
        )
      } else {
        setPaySeverity('error')
        setPayHint(res.message || 'Could not complete payment.')
      }
    } catch {
      setPaySeverity('error')
      setPayHint(
        'Pay API unavailable. Upload APIs/fees/pay.php and _pay_helpers.php',
      )
    } finally {
      setPaying(false)
    }
  }

  async function handleConfirmCashUpi() {
    if (payMethod === 'cash' && !receiptNo.trim()) {
      setPaySeverity('error')
      setPayHint('Cash receipt number is required.')
      return
    }
    if (payMethod === 'upi' && !refNo.trim()) {
      setPaySeverity('error')
      setPayHint('UPI reference is required.')
      return
    }
    await submitPay({
      receipt_no: receiptNo.trim(),
      ref_no: refNo.trim(),
      remarks: remarks.trim(),
    })
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
                  ? `${selectedIds.size} fee(s) · ${selectedMethod.label} · wallet ₹${formatInr(wallet)}${
                      shortfall > 0
                        ? ` · shortfall ₹${formatInr(shortfall)}`
                        : ' · covered by wallet'
                    }`
                  : 'Select fees · choose Through method · pay earlier months first'}
              </p>
              <div className="student-fees-paybar__actions">
                <Button
                  variant="outlined"
                  className="student-fees-paybar__method-btn"
                  disabled={selectedIds.size === 0 || paying}
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
                  disabled={selectedIds.size === 0 || paying}
                  onClick={handlePayClick}
                >
                  {paying ? 'Paying…' : `PAY ${formatPayAmount(selectedTotal)}/-`}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      <Dialog
        open={payDialogOpen}
        onClose={paying ? undefined : () => setPayDialogOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>
          {payMethod === 'cash' ? 'Cash payment' : 'UPI payment'}
        </DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: 1 }}>
          <p style={{ margin: 0, color: '#3d5348', fontSize: 14 }}>
            Selected ₹{formatInr(selectedTotal)} · Wallet ₹{formatInr(wallet)} ·
            Credit shortfall <strong>₹{formatInr(shortfall)}</strong> then settle.
          </p>
          {payMethod === 'cash' ? (
            <TextField
              label="Receipt no"
              value={receiptNo}
              onChange={(e) => setReceiptNo(e.target.value)}
              required
              fullWidth
              size="small"
              autoFocus
            />
          ) : (
            <TextField
              label="UPI / UTR ref"
              value={refNo}
              onChange={(e) => setRefNo(e.target.value)}
              required
              fullWidth
              size="small"
              autoFocus
            />
          )}
          <TextField
            label="Remarks"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            fullWidth
            size="small"
            multiline
            minRows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button disabled={paying} onClick={() => setPayDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={paying}
            onClick={handleConfirmCashUpi}
          >
            {paying ? 'Saving…' : 'Confirm & pay'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(payHint)}
        autoHideDuration={5000}
        onClose={() => setPayHint('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={paySeverity}
          onClose={() => setPayHint('')}
          sx={{ width: '100%' }}
        >
          {payHint}
        </Alert>
      </Snackbar>
    </section>
  )
}

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100
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
  const [walletOpen, setWalletOpen] = useState(false)
  const [walletSaving, setWalletSaving] = useState(false)
  const [walletMethod, setWalletMethod] = useState('cash')
  const [walletAmount, setWalletAmount] = useState('')
  const [walletReceipt, setWalletReceipt] = useState('')
  const [walletRef, setWalletRef] = useState('')
  const [walletRemarks, setWalletRemarks] = useState('')

  function showComingSoon(label) {
    setToast({ open: true, message: `${label} is coming soon.`, severity: 'info' })
  }

  function showToast(message, severity = 'info') {
    setToast({ open: true, message, severity })
  }

  function resetWalletForm() {
    setWalletMethod('cash')
    setWalletAmount('')
    setWalletReceipt('')
    setWalletRef('')
    setWalletRemarks('')
  }

  function openAddWallet() {
    resetWalletForm()
    setWalletOpen(true)
  }

  async function handleAddWallet() {
    const amount = Number(walletAmount)
    if (!(amount > 0)) {
      showToast('Enter a valid amount.', 'error')
      return
    }
    if (walletMethod === 'cash' && !walletReceipt.trim()) {
      showToast('Cash receipt number is required.', 'error')
      return
    }
    if (walletMethod === 'upi' && !walletRef.trim()) {
      showToast('UPI reference is required.', 'error')
      return
    }
    setWalletSaving(true)
    try {
      const res = await adminAddToWallet({
        st_id: Number(student.st_id),
        amount,
        method: walletMethod,
        receipt_no: walletReceipt.trim(),
        ref_no: walletRef.trim(),
        remarks: walletRemarks.trim(),
      })
      if (Number(res.status) === 200) {
        setWalletOpen(false)
        resetWalletForm()
        showToast(res.message || 'Wallet credited.', 'success')
        await load(false)
      } else {
        showToast(res.message || 'Could not add to wallet.', 'error')
      }
    } catch {
      showToast(
        'Add-to-wallet API unavailable. Upload APIs/fees/add_to_wallet.php',
        'error',
      )
    } finally {
      setWalletSaving(false)
    }
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
                onClick={openAddWallet}
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
              optional
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
              optional
            />
            <InlineField
              label="Aadhaar No"
              value={student.aadhaar}
              fieldKey="aadhaar"
              stId={student.st_id}
              onSaved={refresh}
              inputMode="numeric"
              optional
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
              optional
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
              optional
              pincodeFill={{
                city: 'address.city',
                state: 'address.state',
                country: 'address.country',
              }}
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
              optional
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
              optional
            />
            <InlineField
              label="Business / Employer"
              value={student.father?.employer_or_business}
              fieldKey="father.employer_or_business"
              stId={student.st_id}
              onSaved={refresh}
              optional
            />
            <InlineField
              label="Nature / Designation"
              value={student.father?.nature_or_designation}
              fieldKey="father.nature_or_designation"
              stId={student.st_id}
              onSaved={refresh}
              optional
            />
            <InlineField
              label="Address Line 1"
              value={student.father?.address_line1}
              fieldKey="father.address_line1"
              stId={student.st_id}
              onSaved={refresh}
              optional
            />
            <InlineField
              label="Address Line 2"
              value={student.father?.address_line2}
              fieldKey="father.address_line2"
              stId={student.st_id}
              onSaved={refresh}
              optional
            />
            <InlineField
              label="City"
              value={student.father?.city}
              fieldKey="father.city"
              stId={student.st_id}
              onSaved={refresh}
              optional
            />
            <InlineField
              label="State"
              value={student.father?.state}
              fieldKey="father.state"
              stId={student.st_id}
              onSaved={refresh}
              optional
            />
            <InlineField
              label="Country"
              value={student.father?.country}
              fieldKey="father.country"
              stId={student.st_id}
              onSaved={refresh}
              optional
            />
            <InlineField
              label="Pincode"
              value={student.father?.pincode}
              fieldKey="father.pincode"
              stId={student.st_id}
              onSaved={refresh}
              inputMode="numeric"
              optional
              pincodeFill={{
                city: 'father.city',
                state: 'father.state',
                country: 'father.country',
              }}
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
              optional
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
              optional
            />
            <InlineField
              label="Business / Employer"
              value={student.mother?.employer_or_business}
              fieldKey="mother.employer_or_business"
              stId={student.st_id}
              onSaved={refresh}
              optional
            />
            <InlineField
              label="Nature / Designation"
              value={student.mother?.nature_or_designation}
              fieldKey="mother.nature_or_designation"
              stId={student.st_id}
              onSaved={refresh}
              optional
            />
            <InlineField
              label="Address Line 1"
              value={student.mother?.address_line1}
              fieldKey="mother.address_line1"
              stId={student.st_id}
              onSaved={refresh}
              optional
            />
            <InlineField
              label="Address Line 2"
              value={student.mother?.address_line2}
              fieldKey="mother.address_line2"
              stId={student.st_id}
              onSaved={refresh}
              optional
            />
            <InlineField
              label="City"
              value={student.mother?.city}
              fieldKey="mother.city"
              stId={student.st_id}
              onSaved={refresh}
              optional
            />
            <InlineField
              label="State"
              value={student.mother?.state}
              fieldKey="mother.state"
              stId={student.st_id}
              onSaved={refresh}
              optional
            />
            <InlineField
              label="Country"
              value={student.mother?.country}
              fieldKey="mother.country"
              stId={student.st_id}
              onSaved={refresh}
              optional
            />
            <InlineField
              label="Pincode"
              value={student.mother?.pincode}
              fieldKey="mother.pincode"
              stId={student.st_id}
              onSaved={refresh}
              inputMode="numeric"
              optional
              pincodeFill={{
                city: 'mother.city',
                state: 'mother.state',
                country: 'mother.country',
              }}
            />
          </DetailSection>
            </>
          ) : null}

          {tab === 'pending' ? (
            <StudentFeesTab
              student={student}
              status="pending"
              onPaid={() => load(false)}
            />
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

      <Dialog
        open={walletOpen}
        onClose={walletSaving ? undefined : () => setWalletOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Add money to wallet</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: 1 }}>
          <TextField
            select
            label="Method"
            value={walletMethod}
            onChange={(e) => setWalletMethod(e.target.value)}
            size="small"
            fullWidth
          >
            <MenuItem value="cash">Cash</MenuItem>
            <MenuItem value="upi">UPI</MenuItem>
          </TextField>
          <TextField
            label="Amount"
            type="number"
            value={walletAmount}
            onChange={(e) => setWalletAmount(e.target.value)}
            size="small"
            fullWidth
            inputProps={{ min: 0, step: '0.01' }}
          />
          {walletMethod === 'cash' ? (
            <TextField
              label="Receipt no"
              value={walletReceipt}
              onChange={(e) => setWalletReceipt(e.target.value)}
              size="small"
              fullWidth
              required
            />
          ) : (
            <TextField
              label="UPI / UTR ref"
              value={walletRef}
              onChange={(e) => setWalletRef(e.target.value)}
              size="small"
              fullWidth
              required
            />
          )}
          <TextField
            label="Remarks"
            value={walletRemarks}
            onChange={(e) => setWalletRemarks(e.target.value)}
            size="small"
            fullWidth
            multiline
            minRows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button disabled={walletSaving} onClick={() => setWalletOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={walletSaving}
            onClick={handleAddWallet}
          >
            {walletSaving ? 'Saving…' : 'Credit wallet'}
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
