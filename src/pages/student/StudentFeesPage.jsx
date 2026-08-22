import { useEffect, useMemo, useState } from 'react'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import CircularProgress from '@mui/material/CircularProgress'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import { getStudentFees } from '@/services/studentPanelApi'
import {
  formatPayAmount,
  isMonthlyFeeEnabled,
  normalizeFeeForSelection,
  sortFeesForPayment,
  sumSelectedFees,
  toggleFeeSelection,
} from '@/utils/feeSelection'

function formatInr(amount) {
  return Number(amount || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  })
}

export default function StudentFeesPage({ status = 'pending' }) {
  const isPaid = status === 'paid'
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [fees, setFees] = useState([])
  const [years, setYears] = useState([])
  /** null = first load (API picks current); 'all' | number-string after */
  const [ayId, setAyId] = useState(null)
  const [ayLabel, setAyLabel] = useState('')
  const [currentAyId, setCurrentAyId] = useState(null)
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [payHint, setPayHint] = useState('')

  const displayFees = useMemo(
    () => sortFeesForPayment(fees.map(normalizeFeeForSelection)),
    [fees],
  )

  const selectedTotal = useMemo(
    () => sumSelectedFees(displayFees, selectedIds),
    [displayFees, selectedIds],
  )

  useEffect(() => {
    setSelectedIds(new Set())
  }, [status, ayId, fees])

  useEffect(() => {
    let alive = true
    async function load() {
      setLoading(true)
      setError('')
      try {
        const filterArg = ayId === null ? undefined : ayId
        const res = await getStudentFees(status, filterArg)
        if (!alive) return
        if (Number(res.status) === 200) {
          setYears(res.data?.years || [])
          setFees(res.data?.fees || [])
          setAyLabel(res.data?.ay_name || '')
          setCurrentAyId(res.data?.current_ay_id ?? null)
          if (ayId === null) {
            const selected = res.data?.ay_id
            setAyId(selected ? String(selected) : 'all')
          }
        } else {
          setFees([])
          setError(res.message || 'Could not load fees.')
        }
      } catch {
        if (alive) {
          setFees([])
          setError(
            'Student fees API unavailable. Upload APIs/student-panel/fees.php',
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
  }, [status, ayId])

  function handleToggleFee(fId) {
    setSelectedIds((prev) => toggleFeeSelection(displayFees, prev, fId))
  }

  function handlePayClick() {
    if (selectedIds.size === 0) return
    setPayHint(
      `Online payment for ₹${formatPayAmount(selectedTotal)}/- will be connected in the next step.`,
    )
  }

  return (
    <section className="module-page student-page">
      <header className="student-page__head student-page__head--row">
        <div>
          <h1 className="text-gold-gradient">
            {isPaid ? 'Paid Fees' : 'Pending Fees'}
          </h1>
          <p>
            {fees.length} record(s)
            {ayLabel ? ` · ${ayLabel}` : ''}
          </p>
        </div>

        <TextField
          select
          size="small"
          label="Academic session"
          value={ayId ?? ''}
          onChange={(e) => setAyId(e.target.value)}
          disabled={ayId === null && loading}
          className="student-page__ay-filter"
          sx={{ minWidth: 210, bgcolor: '#fff' }}
        >
          {years.map((y) => (
            <MenuItem key={y.ay_id} value={String(y.ay_id)}>
              {y.ay_name}
              {y.is_current || Number(y.ay_id) === Number(currentAyId)
                ? ' (Current)'
                : ''}
            </MenuItem>
          ))}
          <MenuItem value="all">All sessions</MenuItem>
        </TextField>
      </header>

      {loading ? (
        <div className="student-page__loading">
          <CircularProgress size={24} />
          Loading fees…
        </div>
      ) : error ? (
        <p className="student-page__error">{error}</p>
      ) : fees.length === 0 ? (
        <p className="student-page__empty">
          No {isPaid ? 'paid' : 'pending'} fees found
          {ayId && ayId !== 'all' ? ' for this session' : ''}.
        </p>
      ) : (
        <div className="student-fees-wrap">
          <table className="student-fees-table">
            <thead>
              <tr>
                {!isPaid ? (
                  <th className="student-fees-table__check" aria-label="Select" />
                ) : null}
                <th>Fee</th>
                <th>Year</th>
                <th>Amount</th>
                {!isPaid ? <th>Due Date</th> : <th>Paid Date</th>}
                {!isPaid ? <th>Late Fee</th> : null}
                <th>Total</th>
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
                        ? 'student-fees-table__row--locked'
                        : undefined
                    }
                  >
                    {!isPaid ? (
                      <td className="student-fees-table__check">
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
                    <td>{fee.ay_name || '—'}</td>
                    <td>₹{formatInr(fee.amount)}</td>
                    <td>{isPaid ? fee.paid_date || '—' : fee.due_date || '—'}</td>
                    {!isPaid ? (
                      <td>₹{formatInr(fee.late_fee_applicable)}</td>
                    ) : null}
                    <td>
                      <strong>₹{formatInr(fee.total)}</strong>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {!isPaid ? (
            <div className="student-fees-paybar">
              <p className="student-fees-paybar__hint">
                {selectedIds.size > 0
                  ? `${selectedIds.size} fee(s) · Online · monthly fees must be paid in order`
                  : 'Select fees to pay · Online payment · pay earlier months first'}
              </p>
              <div className="student-fees-paybar__actions">
                <span className="student-fees-paybar__method-static">
                  Through: Online
                </span>
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
