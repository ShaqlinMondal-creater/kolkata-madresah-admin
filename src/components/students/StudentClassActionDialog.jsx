import { useEffect, useMemo, useState } from 'react'
import Autocomplete from '@mui/material/Autocomplete'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import TextField from '@mui/material/TextField'
import { getClassesByYear } from '@/services/classesApi'
import { changeStudentClass, upgradeStudents } from '@/services/studentsApi'

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

export default function StudentClassActionDialog({
  open,
  mode,
  onClose,
  years = [],
  stIds = [],
  listFilters = {},
  defaultAyId = '',
  onSuccess,
}) {
  const isUpgrade = mode === 'upgrade'
  const [ayId, setAyId] = useState('')
  const [targetCgId, setTargetCgId] = useState('')
  const [classes, setClasses] = useState([])
  const [loadingClasses, setLoadingClasses] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const countLabel = useMemo(() => {
    if (stIds.length === 1) return '1 student selected'
    if (stIds.length > 1) return `${stIds.length} students selected`
    return 'All students matching current filters'
  }, [stIds.length])

  const selectedYear = useMemo(
    () => years.find((y) => String(y.ay_id) === String(ayId)) || null,
    [years, ayId],
  )

  const selectedClass = useMemo(
    () => classes.find((cg) => String(cg.cg_id) === String(targetCgId)) || null,
    [classes, targetCgId],
  )

  useEffect(() => {
    if (!open) return
    setError('')
    setTargetCgId('')
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
      setClasses([])
      return
    }
    let alive = true
    async function load() {
      setLoadingClasses(true)
      try {
        const res = await getClassesByYear(ayId)
        if (!alive) return
        setClasses(res.data?.classes || [])
      } catch {
        if (alive) setClasses([])
      } finally {
        if (alive) setLoadingClasses(false)
      }
    }
    load()
    return () => {
      alive = false
    }
  }, [open, ayId])

  async function submit() {
    if (!ayId || !targetCgId) {
      setError('Select academic year and class.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const actionFilters = stIds.length
        ? null
        : { ...listFilters, ay_id: ayId }
      const payload = {
        stIds,
        filters: actionFilters,
        targetCgId,
      }
      const res = isUpgrade
        ? await upgradeStudents({
            ...payload,
            sourceAyId: ayId,
          })
        : await changeStudentClass({
            ...payload,
            ayId,
          })

      if (Number(res.status) === 200) {
        onSuccess?.(res)
        onClose()
      } else {
        setError(res.message || 'Action could not be completed.')
      }
    } catch {
      setError(
        isUpgrade
          ? 'Upgrade API unavailable. Upload APIs/students/upgrade.php'
          : 'Change class API unavailable. Upload APIs/students/change_class.php',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>
        {isUpgrade ? 'Upgrade student' : 'Change class'}
      </DialogTitle>
      <DialogContent dividers sx={{ display: 'grid', gap: 1.25, pt: 1.5 }}>
        <p className="student-action-dialog__hint">{countLabel}</p>
        {isUpgrade ? (
          <p className="student-action-dialog__note">
            Pending fees do not block upgrade. Unpaid amounts stay on the
            student after they move class.
          </p>
        ) : (
          <p className="student-action-dialog__note">
            Moves students to another class in the same academic year. Off-roll
            students are skipped.
          </p>
        )}

        <Autocomplete
          size="small"
          options={years}
          value={selectedYear}
          onChange={(_, next) => {
            setAyId(next ? String(next.ay_id) : '')
            setTargetCgId('')
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
          options={classes}
          value={selectedClass}
          onChange={(_, next) =>
            setTargetCgId(next ? String(next.cg_id) : '')
          }
          disabled={!ayId || loadingClasses}
          loading={loadingClasses}
          getOptionLabel={(opt) => opt.cg_name || ''}
          isOptionEqualToValue={(a, b) => String(a.cg_id) === String(b.cg_id)}
          noOptionsText={
            loadingClasses ? 'Loading classes…' : 'No classes for this year'
          }
          autoHighlight
          slotProps={autocompletePopperSx}
          renderInput={(params) => (
            <TextField
              {...params}
              label={isUpgrade ? 'Upgrade to class' : 'New class'}
              sx={fieldSx}
            />
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
          disabled={submitting || !ayId || !targetCgId}
        >
          {submitting ? (
            <>
              <CircularProgress size={16} sx={{ mr: 1 }} color="inherit" />
              Saving…
            </>
          ) : isUpgrade ? (
            'Upgrade'
          ) : (
            'Change class'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
