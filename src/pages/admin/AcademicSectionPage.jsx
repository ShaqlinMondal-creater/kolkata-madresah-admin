import { useEffect, useMemo, useState } from 'react'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Menu from '@mui/material/Menu'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import CircularProgress from '@mui/material/CircularProgress'
import LinearProgress from '@mui/material/LinearProgress'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import Collapse from '@mui/material/Collapse'
import AddIcon from '@mui/icons-material/Add'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import StarBorderOutlinedIcon from '@mui/icons-material/StarBorderOutlined'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import CloseIcon from '@mui/icons-material/Close'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import {
  createAcademicYear,
  getAcademicYears,
  setCurrentAcademicYear,
  updateAcademicYear,
} from '@/services/academicYearApi'
import { getClassesByYear } from '@/services/classesApi'
import { getFeePlansByYear } from '@/services/feePlansApi'

const emptyForm = {
  ay_id: null,
  ay_name: '',
  ay_start_year: '',
  ay_start_month: 4,
  ay_end_year: '',
  ay_end_month: 3,
  ay_current: false,
}

const MONTHS = [
  { value: 1, label: 'Jan' },
  { value: 2, label: 'Feb' },
  { value: 3, label: 'Mar' },
  { value: 4, label: 'Apr' },
  { value: 5, label: 'May' },
  { value: 6, label: 'Jun' },
  { value: 7, label: 'Jul' },
  { value: 8, label: 'Aug' },
  { value: 9, label: 'Sep' },
  { value: 10, label: 'Oct' },
  { value: 11, label: 'Nov' },
  { value: 12, label: 'Dec' },
]

function monthLabel(m) {
  return MONTHS.find((item) => item.value === Number(m))?.label || '—'
}

function formatInr(amount) {
  return Number(amount || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  })
}

function SessionMenu({ row, onAction }) {
  const [anchorEl, setAnchorEl] = useState(null)
  const open = Boolean(anchorEl)

  return (
    <>
      <IconButton
        size="small"
        aria-label={`Actions for ${row.ay_name}`}
        onClick={(e) => {
          e.stopPropagation()
          setAnchorEl(e.currentTarget)
        }}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem
          onClick={() => {
            setAnchorEl(null)
            onAction('edit', row)
          }}
        >
          <ListItemIcon>
            <EditOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit session</ListItemText>
        </MenuItem>
        <MenuItem
          disabled={!!row.ay_current}
          onClick={() => {
            setAnchorEl(null)
            onAction('current', row)
          }}
        >
          <ListItemIcon>
            <StarBorderOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Set as current</ListItemText>
        </MenuItem>
      </Menu>
    </>
  )
}

function SeasonPanel({
  year,
  expanded,
  onToggle,
  onSessionAction,
  onComingSoon,
}) {
  const [tab, setTab] = useState(0)
  const [classSearch, setClassSearch] = useState('')
  const [planSearch, setPlanSearch] = useState('')
  const [classes, setClasses] = useState([])
  const [plans, setPlans] = useState([])
  const [loadingClasses, setLoadingClasses] = useState(false)
  const [loadingPlans, setLoadingPlans] = useState(false)
  const [plansError, setPlansError] = useState('')
  const [loaded, setLoaded] = useState({ classes: false, plans: false })

  const debouncedClassSearch = useDebounced(classSearch, 350)
  const debouncedPlanSearch = useDebounced(planSearch, 350)

  useEffect(() => {
    if (!expanded) return
    let alive = true

    async function loadClasses() {
      setLoadingClasses(true)
      try {
        const res = await getClassesByYear(year.ay_id, debouncedClassSearch, {
          includeStudentCount: true,
        })
        if (!alive) return
        if (Number(res.status) === 200) {
          setClasses(res.data?.classes || [])
          setLoaded((prev) => ({ ...prev, classes: true }))
        } else {
          setClasses([])
        }
      } catch {
        if (alive) setClasses([])
      } finally {
        if (alive) setLoadingClasses(false)
      }
    }

    loadClasses()
    return () => {
      alive = false
    }
  }, [expanded, year.ay_id, debouncedClassSearch])

  useEffect(() => {
    if (!expanded || tab !== 1) return
    let alive = true

    async function loadPlans() {
      setLoadingPlans(true)
      setPlansError('')
      try {
        const res = await getFeePlansByYear(year.ay_id, debouncedPlanSearch)
        if (!alive) return
        if (Number(res.status) === 200) {
          setPlans(res.data?.plans || [])
          setLoaded((prev) => ({ ...prev, plans: true }))
        } else {
          setPlans([])
          setPlansError(res.message || 'Could not load fee plans.')
        }
      } catch (err) {
        if (alive) {
          setPlans([])
          setPlansError(
            err instanceof Error
              ? err.message
              : 'Fee plans API unavailable. Upload APIs/fees/plans_list.php',
          )
        }
      } finally {
        if (alive) setLoadingPlans(false)
      }
    }

    loadPlans()
    return () => {
      alive = false
    }
  }, [expanded, tab, year.ay_id, debouncedPlanSearch])

  const fromLabel = `${monthLabel(year.ay_start_month)} to ${monthLabel(year.ay_end_month)}`

  return (
    <article
      className={`ay-acc__item${expanded ? ' is-open' : ''}${year.ay_current ? ' is-current' : ''}`}
    >
      <header className="ay-acc__head" onClick={onToggle}>
        <div className="ay-acc__title">
          <strong>{year.ay_name}</strong>
          {year.ay_current ? <span className="ay-acc__current">Current</span> : null}
          <span className="ay-acc__meta">{fromLabel}</span>
        </div>
        <div className="ay-acc__stats" onClick={(e) => e.stopPropagation()}>
          <span>{Number(year.class_count || 0)} Classes</span>
          <span>{Number(year.fee_plan_count || 0)} Fee Plans</span>
          <SessionMenu row={year} onAction={onSessionAction} />
          <IconButton
            size="small"
            aria-label={expanded ? 'Collapse' : 'Expand'}
            onClick={onToggle}
            className={`ay-acc__chevron${expanded ? ' is-open' : ''}`}
          >
            <ExpandMoreIcon />
          </IconButton>
        </div>
      </header>

      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <div className="ay-acc__body">
          <div className="ay-acc__controls">
            <div className="ay-seg" role="tablist" aria-label="Session details">
              <button
                type="button"
                role="tab"
                aria-selected={tab === 0}
                className={`ay-seg__btn${tab === 0 ? ' is-active' : ''}`}
                onClick={() => setTab(0)}
              >
                Classes
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === 1}
                className={`ay-seg__btn${tab === 1 ? ' is-active' : ''}`}
                onClick={() => setTab(1)}
              >
                Fee Plan
              </button>
            </div>
            <div className="ay-acc__toolbar">
              <Button
                variant="outlined"
                size="small"
                startIcon={<ContentCopyIcon />}
                onClick={() =>
                  onComingSoon(
                    tab === 0
                      ? 'Copy classes from previous year'
                      : 'Copy fee plans from previous year',
                  )
                }
              >
                Copy from Previous Year
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={() =>
                  onComingSoon(tab === 0 ? 'Add new class' : 'Add new fee plan')
                }
              >
                Add New
              </Button>
            </div>
          </div>

          {tab === 0 ? (
            <div className="ay-acc__panel">
              <TextField
                size="small"
                placeholder="Search by class name…"
                value={classSearch}
                onChange={(e) => setClassSearch(e.target.value)}
                fullWidth
                sx={{ bgcolor: '#fff' }}
              />

              <div className="ay-acc__scroll">
                {loadingClasses && !loaded.classes ? (
                  <div className="ay-acc__loading">
                    <CircularProgress size={22} />
                    Loading classes…
                  </div>
                ) : classes.length === 0 ? (
                  <p className="ay-acc__empty">No classes for this session.</p>
                ) : (
                  <div className="ay-class-grid">
                    {classes.map((cls) => (
                      <div key={cls.cg_id} className="ay-class-card">
                        <div className="ay-class-card__body">
                          <strong>{cls.cg_name}</strong>
                          {cls.cg_section_number ? (
                            <span>Section {cls.cg_section_number}</span>
                          ) : null}
                        </div>
                        <div className="ay-class-card__foot">
                          <span>
                            <GroupsOutlinedIcon fontSize="inherit" />
                            {Number(cls.student_count || 0)}
                          </span>
                          <Tooltip title="Edit class">
                            <IconButton
                              size="small"
                              onClick={() =>
                                onComingSoon(`Edit class ${cls.cg_name}`)
                              }
                            >
                              <EditOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {loadingClasses && loaded.classes ? <LinearProgress /> : null}
            </div>
          ) : (
            <div className="ay-acc__panel">
              <TextField
                size="small"
                placeholder="Search fee plan…"
                value={planSearch}
                onChange={(e) => setPlanSearch(e.target.value)}
                fullWidth
                sx={{ bgcolor: '#fff' }}
              />

              <div className="ay-acc__scroll">
                {loadingPlans && !loaded.plans ? (
                  <div className="ay-acc__loading">
                    <CircularProgress size={22} />
                    Loading fee plans…
                  </div>
                ) : plansError ? (
                  <p className="ay-acc__empty ay-acc__empty--error">{plansError}</p>
                ) : plans.length === 0 ? (
                  <p className="ay-acc__empty">No fee plans for this session.</p>
                ) : (
                  <div className="ay-plan-list">
                    {plans.map((plan) => (
                      <div key={plan.fp_id} className="ay-plan-card">
                        <div className="ay-plan-card__main">
                          <strong>{plan.fp_name}</strong>
                          <span className="pill pill--mode-cash">
                            {plan.fp_type}
                          </span>
                        </div>
                        <div className="ay-plan-card__meta">
                          <span>Classes: {plan.class_names_label || '—'}</span>
                          <span>Lines: {plan.line_count}</span>
                          <span>Total: ₹{formatInr(plan.amount_total)}</span>
                        </div>
                        <div className="ay-plan-card__actions">
                          <Tooltip title="Edit fee plan">
                            <IconButton
                              size="small"
                              onClick={() =>
                                onComingSoon(`Edit fee plan ${plan.fp_name}`)
                              }
                            >
                              <EditOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {loadingPlans && loaded.plans ? <LinearProgress /> : null}
            </div>
          )}
        </div>
      </Collapse>
    </article>
  )
}

function useDebounced(value, delay = 350) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return v
}

export default function AcademicSectionPage() {
  const [years, setYears] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' })
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let alive = true
    async function load() {
      setLoading(true)
      setError('')
      try {
        const res = await getAcademicYears()
        if (!alive) return
        if (Number(res.status) === 200 && res.data?.years) {
          const list = res.data.years
          setYears(list)
          const current =
            list.find((y) => y.ay_current)?.ay_id ||
            res.data.current_ay_id ||
            list[0]?.ay_id ||
            null
          setExpandedId((prev) => prev ?? (current ? Number(current) : null))
        } else {
          setYears([])
          setError(res.message || 'Could not load academic sessions.')
        }
      } catch {
        if (alive) {
          setYears([])
          setError('Academic year API is unavailable. Please upload APIs/academic-year/.')
        }
      } finally {
        if (alive) setLoading(false)
      }
    }
    load()
    return () => {
      alive = false
    }
  }, [reloadKey])

  const currentName = useMemo(() => {
    const cur = years.find((y) => y.ay_current)
    return cur?.ay_name || '—'
  }, [years])

  function showToast(message, severity = 'success') {
    setToast({ open: true, message, severity })
  }

  function openCreate() {
    const y = new Date().getFullYear()
    setForm({
      ...emptyForm,
      ay_name: `${y}-${String(y + 1).slice(-2)}`,
      ay_start_year: String(y),
      ay_end_year: String(y + 1),
      ay_start_month: 4,
      ay_end_month: 3,
      ay_current: false,
    })
    setFormError('')
    setDialogOpen(true)
  }

  function openEdit(row) {
    setForm({
      ay_id: row.ay_id,
      ay_name: row.ay_name || '',
      ay_start_year: String(row.ay_start_year || ''),
      ay_start_month: Number(row.ay_start_month || 4),
      ay_end_year: String(row.ay_end_year || ''),
      ay_end_month: Number(row.ay_end_month || 3),
      ay_current: !!row.ay_current,
    })
    setFormError('')
    setDialogOpen(true)
  }

  async function onSetCurrent(row) {
    setSaving(true)
    try {
      const res = await setCurrentAcademicYear(row.ay_id)
      if (Number(res.status) === 200) {
        showToast(`${row.ay_name} is now the current session.`)
        setReloadKey((k) => k + 1)
      } else {
        showToast(res.message || 'Could not set current session.', 'error')
      }
    } catch {
      showToast('Set current API is unavailable.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function onSave() {
    const payload = {
      ay_name: form.ay_name.trim(),
      ay_start_year: Number(form.ay_start_year),
      ay_start_month: Number(form.ay_start_month),
      ay_end_year: Number(form.ay_end_year),
      ay_end_month: Number(form.ay_end_month),
      ay_current: !!form.ay_current,
    }

    if (!payload.ay_name) {
      setFormError('Session name is required.')
      return
    }
    if (!payload.ay_start_year || !payload.ay_end_year) {
      setFormError('Start year and end year are required.')
      return
    }

    setSaving(true)
    setFormError('')
    try {
      const res = form.ay_id
        ? await updateAcademicYear({ ...payload, ay_id: form.ay_id })
        : await createAcademicYear(payload)

      if (Number(res.status) === 200) {
        setDialogOpen(false)
        showToast(form.ay_id ? 'Session updated.' : 'Session created.')
        setReloadKey((k) => k + 1)
      } else {
        setFormError(res.message || 'Could not save academic session.')
      }
    } catch {
      setFormError('Save API is unavailable.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="module-page academic-page">
      <header className="academic-page__head">
        <div>
          <h1 className="text-gold-gradient">Academic Section</h1>
        </div>
        <div className="academic-page__head-actions">
          <div className="academic-page__current-badge">
            Current Year — <strong>{currentName}</strong>
          </div>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={openCreate}
          >
            Add New Year
          </Button>
        </div>
      </header>

      {error ? <p className="academic-page__error">{error}</p> : null}

      <div className="ay-acc">
        {(loading || saving) && years.length === 0 ? (
          <div className="ay-acc__loading">
            <CircularProgress size={24} />
            Loading sessions…
          </div>
        ) : years.length === 0 ? (
          <p className="ay-acc__empty">No academic sessions found.</p>
        ) : (
          years.map((year) => (
            <SeasonPanel
              key={year.ay_id}
              year={year}
              expanded={Number(expandedId) === Number(year.ay_id)}
              onToggle={() =>
                setExpandedId((prev) =>
                  Number(prev) === Number(year.ay_id) ? null : year.ay_id,
                )
              }
              onSessionAction={(action, row) => {
                if (action === 'edit') openEdit(row)
                else onSetCurrent(row)
              }}
              onComingSoon={(msg) => showToast(`${msg} is coming soon.`, 'info')}
            />
          ))
        )}
      </div>

      <Dialog
        open={dialogOpen}
        onClose={() => !saving && setDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ pr: 6, py: 1.1, px: 1.5, fontSize: '1.05rem' }}>
          {form.ay_id ? 'Edit session' : 'Add session'}
          <IconButton
            aria-label="Close"
            size="small"
            onClick={() => setDialogOpen(false)}
            sx={{ position: 'absolute', right: 6, top: 6 }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ px: 1.5, py: 1.25 }}>
          <div className="academic-form">
            <TextField
              label="Session name"
              placeholder="2026-27"
              value={form.ay_name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, ay_name: e.target.value }))
              }
              size="small"
              fullWidth
            />
            <div className="academic-form__row">
              <TextField
                label="Start year"
                type="number"
                value={form.ay_start_year}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, ay_start_year: e.target.value }))
                }
                size="small"
                fullWidth
              />
              <TextField
                select
                label="Start month"
                value={form.ay_start_month}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    ay_start_month: Number(e.target.value),
                  }))
                }
                size="small"
                fullWidth
              >
                {MONTHS.map((m) => (
                  <MenuItem key={m.value} value={m.value}>
                    {m.label}
                  </MenuItem>
                ))}
              </TextField>
            </div>
            <div className="academic-form__row">
              <TextField
                label="End year"
                type="number"
                value={form.ay_end_year}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, ay_end_year: e.target.value }))
                }
                size="small"
                fullWidth
              />
              <TextField
                select
                label="End month"
                value={form.ay_end_month}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    ay_end_month: Number(e.target.value),
                  }))
                }
                size="small"
                fullWidth
              >
                {MONTHS.map((m) => (
                  <MenuItem key={m.value} value={m.value}>
                    {m.label}
                  </MenuItem>
                ))}
              </TextField>
            </div>
            <FormControlLabel
              control={
                <Switch
                  checked={!!form.ay_current}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      ay_current: e.target.checked,
                    }))
                  }
                />
              }
              label="Set as current session"
            />
            {formError ? <p className="academic-form__error">{formError}</p> : null}
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 1.5, py: 0.85 }}>
          <Button size="small" onClick={() => setDialogOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button size="small" variant="contained" onClick={onSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={toast.severity}
          variant="filled"
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </section>
  )
}
