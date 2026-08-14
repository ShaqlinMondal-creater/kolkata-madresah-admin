import { useEffect, useMemo, useState } from 'react'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import {
  createFeePlanLine,
  getFeePlanLines,
  updateFeePlanLine,
} from '@/services/feePlansApi'

const fieldSx = {
  width: '100%',
  bgcolor: '#fff',
  '& .MuiOutlinedInput-root': { borderRadius: '0.65rem' },
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const emptyLine = {
  fpp_id: null,
  name: '',
  amount: '',
  due_date: '',
  late_fee: '0',
}

function formatInr(n) {
  const num = Number(n) || 0
  return num.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

function pad2(n) {
  return String(n).padStart(2, '0')
}

function isMonthlyPlanType(fpType) {
  const t = String(fpType || '').toLowerCase()
  return t === 'main monthly fee' || t === 'monthly fee'
}

/** Build Apr–Mar (or session range) month rows for monthly fee create */
function buildSessionMonths(plan) {
  const startMonth = Number(plan?.ay_start_month) || 4
  const startYear = Number(plan?.ay_start_year) || new Date().getFullYear()
  const endMonth = Number(plan?.ay_end_month) || 3
  const endYear =
    Number(plan?.ay_end_year) ||
    (endMonth < startMonth ? startYear + 1 : startYear)

  const rows = []
  let y = startYear
  let m = startMonth
  let guard = 0

  while (guard < 24) {
    guard += 1
    const monthName = MONTH_NAMES[m - 1] || `Month${m}`
    rows.push({
      key: `${y}-${m}`,
      month: m,
      year: y,
      name: `${monthName}-${y} Fees`,
      amount: '',
      due_date: `10-${pad2(m)}-${y}`,
      late_fee: '0',
      checked: true,
      alreadyAdded: false,
    })

    if (y === endYear && m === endMonth) break
    m += 1
    if (m > 12) {
      m = 1
      y += 1
    }
  }

  return rows
}

export default function FeePlanLinesDialog({
  open,
  onClose,
  plan = null,
  onChanged,
}) {
  const [lines, setLines] = useState([])
  const [amountTotal, setAmountTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveProgress, setSaveProgress] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyLine)
  const [showForm, setShowForm] = useState(false)
  const [showMonthly, setShowMonthly] = useState(false)
  const [monthlyRows, setMonthlyRows] = useState([])
  const [defaultAmount, setDefaultAmount] = useState('')
  const [defaultLateFee, setDefaultLateFee] = useState('0')

  const fpId = plan?.fp_id ? Number(plan.fp_id) : 0
  const isEdit = Boolean(form.fpp_id)
  const monthlyPlan = isMonthlyPlanType(plan?.fp_type)

  const existingNames = useMemo(
    () => new Set(lines.map((l) => String(l.name || '').trim().toLowerCase())),
    [lines],
  )

  const selectableMonthly = monthlyRows.filter((r) => !r.alreadyAdded)
  const checkedCount = selectableMonthly.filter((r) => r.checked).length
  const allChecked =
    selectableMonthly.length > 0 &&
    checkedCount === selectableMonthly.length

  async function loadLines() {
    if (!fpId) return
    setLoading(true)
    setError('')
    try {
      const res = await getFeePlanLines(fpId)
      if (Number(res.status) === 200) {
        setLines(res.data?.lines || [])
        setAmountTotal(Number(res.data?.amount_total) || 0)
      } else {
        setError(res.message || 'Could not load fee lines.')
        setLines([])
        setAmountTotal(0)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load fee lines.')
      setLines([])
      setAmountTotal(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!open) return
    setError('')
    setShowForm(false)
    setShowMonthly(false)
    setForm(emptyLine)
    setDefaultAmount('')
    setDefaultLateFee('0')
    setSaveProgress('')
    loadLines()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when dialog opens / plan changes
  }, [open, fpId])

  function openAdd() {
    setError('')
    setForm(emptyLine)
    if (monthlyPlan) {
      const rows = buildSessionMonths(plan).map((row) => {
        const exists = existingNames.has(row.name.toLowerCase())
        return {
          ...row,
          alreadyAdded: exists,
          checked: !exists,
        }
      })
      setMonthlyRows(rows)
      setDefaultAmount('')
      setDefaultLateFee('0')
      setShowMonthly(true)
      setShowForm(false)
      return
    }
    setShowMonthly(false)
    setShowForm(true)
  }

  function openEdit(line) {
    setForm({
      fpp_id: line.fpp_id,
      name: line.name || '',
      amount: String(line.amount ?? ''),
      due_date: line.due_date || '',
      late_fee: String(line.late_fee ?? '0'),
    })
    setShowMonthly(false)
    setShowForm(true)
    setError('')
  }

  function cancelForm() {
    setShowForm(false)
    setShowMonthly(false)
    setForm(emptyLine)
    setMonthlyRows([])
    setSaveProgress('')
    setError('')
  }

  function toggleAllMonthly(checked) {
    setMonthlyRows((rows) =>
      rows.map((r) => (r.alreadyAdded ? r : { ...r, checked })),
    )
  }

  function updateMonthlyRow(key, patch) {
    setMonthlyRows((rows) =>
      rows.map((r) => (r.key === key ? { ...r, ...patch } : r)),
    )
  }

  function applyDefaultsToRows() {
    setMonthlyRows((rows) =>
      rows.map((r) =>
        r.alreadyAdded
          ? r
          : {
              ...r,
              amount: defaultAmount !== '' ? defaultAmount : r.amount,
              late_fee: defaultLateFee !== '' ? defaultLateFee : r.late_fee,
            },
      ),
    )
  }

  async function submitMonthly() {
    const selected = monthlyRows.filter((r) => r.checked && !r.alreadyAdded)
    if (!selected.length) {
      setError('Select at least one month.')
      return
    }
    for (const row of selected) {
      if (row.amount === '' || Number.isNaN(Number(row.amount))) {
        setError(`Valid amount required for ${row.name}.`)
        return
      }
      if (!String(row.due_date || '').trim()) {
        setError(`Due date required for ${row.name}.`)
        return
      }
    }

    setSaving(true)
    setError('')
    let created = 0
    let lastRes = null

    try {
      for (let i = 0; i < selected.length; i += 1) {
        const row = selected[i]
        setSaveProgress(`Creating ${i + 1}/${selected.length}…`)
        const res = await createFeePlanLine({
          fp_id: fpId,
          name: row.name,
          amount: row.amount,
          due_date: String(row.due_date).trim(),
          late_fee: row.late_fee === '' ? '0' : row.late_fee,
        })
        if (Number(res.status) !== 200) {
          setError(
            res.message ||
              `Could not create “${row.name}” (${created} created before error).`,
          )
          await loadLines()
          if (created > 0) onChanged?.(lastRes)
          return
        }
        created += 1
        lastRes = res
      }

      setShowMonthly(false)
      setMonthlyRows([])
      setDefaultAmount('')
      setDefaultLateFee('0')
      setSaveProgress('')
      await loadLines()
      onChanged?.(
        lastRes || {
          status: 200,
          message: `${created} monthly fee line(s) created.`,
        },
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Could not create monthly fees (${created} created before error).`,
      )
      await loadLines()
      if (created > 0) onChanged?.(lastRes)
    } finally {
      setSaving(false)
      setSaveProgress('')
    }
  }

  async function submit() {
    if (!form.name.trim()) {
      setError('Fee name is required.')
      return
    }
    if (form.amount === '' || Number.isNaN(Number(form.amount))) {
      setError('Valid amount is required.')
      return
    }
    if (!form.due_date.trim()) {
      setError('Due date is required (DD-MM-YYYY).')
      return
    }

    setSaving(true)
    setError('')
    try {
      const payload = {
        name: form.name.trim(),
        amount: form.amount,
        due_date: form.due_date.trim(),
        late_fee: form.late_fee === '' ? '0' : form.late_fee,
      }
      const res = isEdit
        ? await updateFeePlanLine({ fpp_id: form.fpp_id, ...payload })
        : await createFeePlanLine({ fp_id: fpId, ...payload })

      if (Number(res.status) !== 200) {
        setError(res.message || 'Could not save fee line.')
        return
      }

      setShowForm(false)
      setForm(emptyLine)
      await loadLines()
      onChanged?.(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save fee line.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth={showMonthly ? 'md' : 'sm'}
      PaperProps={{ sx: { borderRadius: '0.85rem' } }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pr: 1,
          py: 1.25,
        }}
      >
        <span>
          Fee lines
          {plan?.fp_name ? (
            <span style={{ fontWeight: 500, opacity: 0.75 }}>
              {' '}
              — {plan.fp_name}
            </span>
          ) : null}
        </span>
        <IconButton size="small" onClick={onClose} disabled={saving}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 1.5 }}>
        <div className="fee-lines-dialog">
          <div className="fee-lines-dialog__summary">
            <span>
              {lines.length} line{lines.length === 1 ? '' : 's'}
            </span>
            <strong>Total ₹{formatInr(amountTotal)}</strong>
            {!showForm && !showMonthly ? (
              <Button
                size="small"
                startIcon={<AddIcon />}
                variant="outlined"
                onClick={openAdd}
                disabled={loading || !fpId}
              >
                {monthlyPlan ? 'Add monthly fees' : 'Add fee'}
              </Button>
            ) : null}
          </div>

          {showMonthly ? (
            <div className="fee-lines-dialog__form fee-lines-dialog__form--monthly">
              <p className="fee-lines-dialog__form-title">
                Add monthly fees
                {plan?.ay_name ? ` · ${plan.ay_name}` : ''}
              </p>
              <p className="fee-lines-dialog__hint">
                Checked months will be created one by one. Uncheck any month you
                don’t need. You can set amount/late fee per row, or fill all
                rows below.
              </p>
              <div className="fee-lines-dialog__fill-row">
                <TextField
                  label="Fill amount (₹)"
                  size="small"
                  value={defaultAmount}
                  onChange={(e) => setDefaultAmount(e.target.value)}
                  placeholder="800"
                  sx={{ ...fieldSx, maxWidth: 160 }}
                  disabled={saving}
                />
                <TextField
                  label="Fill late fee"
                  size="small"
                  value={defaultLateFee}
                  onChange={(e) => setDefaultLateFee(e.target.value)}
                  placeholder="0"
                  sx={{ ...fieldSx, maxWidth: 140 }}
                  disabled={saving}
                />
                <Button
                  size="small"
                  variant="outlined"
                  onClick={applyDefaultsToRows}
                  disabled={saving}
                >
                  Apply to all rows
                </Button>
              </div>

              <div className="fee-lines-monthly">
                <table className="fee-lines-monthly__table">
                  <thead>
                    <tr>
                      <th>
                        <Checkbox
                          size="small"
                          checked={allChecked}
                          indeterminate={
                            checkedCount > 0 &&
                            checkedCount < selectableMonthly.length
                          }
                          onChange={(e) => toggleAllMonthly(e.target.checked)}
                          disabled={saving || selectableMonthly.length === 0}
                        />
                      </th>
                      <th>Fee name</th>
                      <th>Amount</th>
                      <th>Due date</th>
                      <th>Late fee</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyRows.map((row) => (
                      <tr
                        key={row.key}
                        className={
                          row.alreadyAdded
                            ? 'fee-lines-monthly__row--done'
                            : undefined
                        }
                      >
                        <td>
                          <Checkbox
                            size="small"
                            checked={row.alreadyAdded ? false : row.checked}
                            disabled={saving || row.alreadyAdded}
                            onChange={(e) =>
                              updateMonthlyRow(row.key, {
                                checked: e.target.checked,
                              })
                            }
                          />
                        </td>
                        <td>
                          <strong>{row.name}</strong>
                          {row.alreadyAdded ? (
                            <span className="fee-lines-monthly__tag">
                              already added
                            </span>
                          ) : null}
                        </td>
                        <td>
                          <TextField
                            size="small"
                            value={row.amount}
                            onChange={(e) =>
                              updateMonthlyRow(row.key, {
                                amount: e.target.value,
                              })
                            }
                            placeholder="800"
                            disabled={saving || row.alreadyAdded}
                            sx={fieldSx}
                          />
                        </td>
                        <td>
                          <TextField
                            size="small"
                            value={row.due_date}
                            onChange={(e) =>
                              updateMonthlyRow(row.key, {
                                due_date: e.target.value,
                              })
                            }
                            placeholder="10-04-2026"
                            disabled={saving || row.alreadyAdded}
                            sx={fieldSx}
                          />
                        </td>
                        <td>
                          <TextField
                            size="small"
                            value={row.late_fee}
                            onChange={(e) =>
                              updateMonthlyRow(row.key, {
                                late_fee: e.target.value,
                              })
                            }
                            placeholder="0"
                            disabled={saving || row.alreadyAdded}
                            sx={fieldSx}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {error ? <p className="academic-form__error">{error}</p> : null}
              {saveProgress ? (
                <p className="fee-lines-dialog__progress">{saveProgress}</p>
              ) : null}
              <div className="fee-lines-dialog__form-actions">
                <Button size="small" onClick={cancelForm} disabled={saving}>
                  Cancel
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={submitMonthly}
                  disabled={saving || checkedCount === 0}
                >
                  {saving
                    ? saveProgress || 'Creating…'
                    : `Create ${checkedCount} fee${checkedCount === 1 ? '' : 's'}`}
                </Button>
              </div>
            </div>
          ) : null}

          {showForm ? (
            <div className="fee-lines-dialog__form">
              <p className="fee-lines-dialog__form-title">
                {isEdit ? 'Edit fee line' : 'Add fee line'}
              </p>
              <div className="fee-lines-dialog__grid">
                <TextField
                  label="Fee name *"
                  size="small"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="e.g. Admission Fee"
                  sx={fieldSx}
                  disabled={saving}
                />
                <TextField
                  label="Amount (₹) *"
                  size="small"
                  value={form.amount}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, amount: e.target.value }))
                  }
                  placeholder="5000"
                  sx={fieldSx}
                  disabled={saving}
                />
                <TextField
                  label="Due date *"
                  size="small"
                  value={form.due_date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, due_date: e.target.value }))
                  }
                  placeholder="15-04-2025"
                  helperText="DD-MM-YYYY"
                  sx={fieldSx}
                  disabled={saving}
                />
                <TextField
                  label="Late fee (₹)"
                  size="small"
                  value={form.late_fee}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, late_fee: e.target.value }))
                  }
                  placeholder="0"
                  sx={fieldSx}
                  disabled={saving}
                />
              </div>
              {error ? <p className="academic-form__error">{error}</p> : null}
              <div className="fee-lines-dialog__form-actions">
                <Button size="small" onClick={cancelForm} disabled={saving}>
                  Cancel
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={submit}
                  disabled={saving}
                >
                  {saving ? 'Saving…' : isEdit ? 'Update' : 'Add'}
                </Button>
              </div>
            </div>
          ) : null}

          {!showForm && !showMonthly && error && !loading ? (
            <p className="academic-form__error">{error}</p>
          ) : null}

          {loading ? (
            <div className="fee-lines-dialog__loading">
              <CircularProgress size={22} />
              Loading…
            </div>
          ) : lines.length === 0 && !showForm && !showMonthly ? (
            <p className="ay-acc__empty">
              {monthlyPlan
                ? 'No monthly fees yet. Click “Add monthly fees” to create April–March lines.'
                : 'No fee lines yet. Add fees (name, amount, due date) so you can apply this plan to students.'}
            </p>
          ) : lines.length > 0 ? (
            <ul className="fee-lines-dialog__list">
              {lines.map((line) => (
                <li key={line.fpp_id} className="fee-lines-dialog__item">
                  <div>
                    <strong>{line.name}</strong>
                    <span>
                      Due {line.due_date || '—'}
                      {Number(line.late_fee) > 0
                        ? ` · Late ₹${formatInr(line.late_fee)}`
                        : ''}
                    </span>
                  </div>
                  <div className="fee-lines-dialog__item-right">
                    <span>₹{formatInr(line.amount)}</span>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => openEdit(line)}
                        disabled={saving || showForm || showMonthly}
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </DialogContent>

      <DialogActions sx={{ px: 1.5, py: 0.85 }}>
        <Button size="small" onClick={onClose} disabled={saving}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}
