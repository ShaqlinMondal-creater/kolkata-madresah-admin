import { useEffect, useMemo, useState } from 'react'
import Autocomplete from '@mui/material/Autocomplete'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import TextField from '@mui/material/TextField'
import { applyFeePlan, getFeePlansByYear } from '@/services/feePlansApi'

const fieldSx = {
  width: '100%',
  bgcolor: '#fff',
  '& .MuiOutlinedInput-root': { borderRadius: '0.65rem' },
}

const autocompletePopperSx = {
  popper: {
    sx: { zIndex: 1400 },
  },
}

export default function ApplyFeePlanDialog({
  open,
  onClose,
  years = [],
  stIds = [],
  listFilters = {},
  defaultAyId = '',
  onSuccess,
}) {
  const [ayId, setAyId] = useState('')
  const [fpId, setFpId] = useState('')
  const [plans, setPlans] = useState([])
  const [loadingPlans, setLoadingPlans] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const countLabel = useMemo(() => {
    if (stIds.length === 1) return '1 student selected'
    if (stIds.length > 1) return `${stIds.length} students selected`
    return 'All on-roll students matching current filters'
  }, [stIds.length])

  const selectedYear = useMemo(
    () => years.find((y) => String(y.ay_id) === String(ayId)) || null,
    [years, ayId],
  )

  const selectedPlan = useMemo(
    () => plans.find((p) => String(p.fp_id) === String(fpId)) || null,
    [plans, fpId],
  )

  useEffect(() => {
    if (!open) return
    setError('')
    setFpId('')
    const fallback =
      defaultAyId && defaultAyId !== 'all'
        ? String(defaultAyId)
        : String(
            years.find((y) => y.ay_current)?.ay_id || years[0]?.ay_id || '',
          )
    setAyId(fallback)
  }, [open, defaultAyId, years])

  useEffect(() => {
    if (!open || !ayId) {
      setPlans([])
      return
    }
    let alive = true
    async function load() {
      setLoadingPlans(true)
      try {
        const res = await getFeePlansByYear(ayId)
        if (!alive) return
        setPlans(res.data?.plans || [])
      } catch {
        if (alive) setPlans([])
      } finally {
        if (alive) setLoadingPlans(false)
      }
    }
    load()
    return () => {
      alive = false
    }
  }, [open, ayId])

  async function submit() {
    if (!fpId) {
      setError('Select a fee plan.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const actionFilters = stIds.length
        ? null
        : { ...listFilters, ay_id: ayId || listFilters.ay_id }
      const res = await applyFeePlan({
        stIds,
        filters: actionFilters,
        fpId,
      })

      if (Number(res.status) === 200) {
        onSuccess?.(res)
        onClose()
      } else {
        setError(res.message || 'Fee plan could not be applied.')
      }
    } catch {
      setError(
        'Apply fee plan API unavailable. Upload APIs/fees/apply_plan.php',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>Apply fee plan</DialogTitle>
      <DialogContent dividers sx={{ display: 'grid', gap: 1.25, pt: 1.5 }}>
        <p className="student-action-dialog__hint">{countLabel}</p>
        <p className="student-action-dialog__note">
          Creates pending fee lines from the selected plan. Existing fee lines
          for the same period are skipped. Off-roll students are skipped.
        </p>

        <Autocomplete
          size="small"
          options={years}
          value={selectedYear}
          onChange={(_, next) => {
            setAyId(next ? String(next.ay_id) : '')
            setFpId('')
          }}
          getOptionLabel={(opt) =>
            `${opt.ay_name || ''}${opt.ay_current ? ' · Current' : ''}`
          }
          isOptionEqualToValue={(a, b) => String(a.ay_id) === String(b.ay_id)}
          autoHighlight
          slotProps={autocompletePopperSx}
          renderInput={(params) => (
            <TextField {...params} label="Academic year" sx={fieldSx} />
          )}
          sx={{ width: '100%' }}
        />

        <Autocomplete
          size="small"
          options={plans}
          value={selectedPlan}
          onChange={(_, next) => setFpId(next ? String(next.fp_id) : '')}
          disabled={!ayId || loadingPlans}
          loading={loadingPlans}
          getOptionLabel={(opt) => {
            const type = opt.fp_type ? ` · ${opt.fp_type}` : ''
            return `${opt.fp_name || ''}${type}`
          }}
          isOptionEqualToValue={(a, b) => String(a.fp_id) === String(b.fp_id)}
          noOptionsText={
            loadingPlans ? 'Loading plans…' : 'No fee plans for this year'
          }
          autoHighlight
          slotProps={autocompletePopperSx}
          renderInput={(params) => (
            <TextField {...params} label="Fee plan" sx={fieldSx} />
          )}
          sx={{ width: '100%' }}
        />

        {error ? <p className="student-action-dialog__error">{error}</p> : null}
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1.25 }}>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={submit}
          disabled={submitting || !fpId}
        >
          {submitting ? (
            <>
              <CircularProgress size={16} sx={{ mr: 1 }} color="inherit" />
              Applying…
            </>
          ) : (
            'Apply'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
