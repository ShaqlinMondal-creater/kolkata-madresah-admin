import { useEffect, useState } from 'react'
import Autocomplete from '@mui/material/Autocomplete'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import CheckBoxIcon from '@mui/icons-material/CheckBox'
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank'
import CloseIcon from '@mui/icons-material/Close'
import { getClassesByYear } from '@/services/classesApi'
import { createFeePlan, updateFeePlan } from '@/services/feePlansApi'

const FEE_PLAN_TYPES = [
  'Main Admission Fee',
  'Main Monthly Fee',
  'Other One-Time Fee',
]

const fieldSx = {
  width: '100%',
  bgcolor: '#fff',
  '& .MuiOutlinedInput-root': { borderRadius: '0.65rem' },
}

const popperSx = { popper: { sx: { zIndex: 1400 } } }
const icon = <CheckBoxOutlineBlankIcon fontSize="small" />
const checkedIcon = <CheckBoxIcon fontSize="small" />

const emptyForm = {
  fp_id: null,
  ay_id: '',
  ay_name: '',
  fp_name: '',
  fp_type: 'Other One-Time Fee',
  cg_ids: [],
}

export default function FeePlanFormDialog({
  open,
  onClose,
  initial = null,
  onSuccess,
}) {
  const [form, setForm] = useState(emptyForm)
  const [classes, setClasses] = useState([])
  const [loadingClasses, setLoadingClasses] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const isEdit = Boolean(form.fp_id)
  const typeOptions =
    form.fp_type === 'Monthly Fee'
      ? [...FEE_PLAN_TYPES, 'Monthly Fee']
      : FEE_PLAN_TYPES

  useEffect(() => {
    if (!open) return
    setError('')
    if (initial) {
      setForm({
        fp_id: initial.fp_id || null,
        ay_id: String(initial.ay_id || ''),
        ay_name: initial.ay_name || '',
        fp_name: initial.fp_name || '',
        fp_type: initial.fp_type || 'Other One-Time Fee',
        cg_ids: Array.isArray(initial.cg_ids)
          ? initial.cg_ids.map(String)
          : [],
      })
    } else {
      setForm(emptyForm)
    }
  }, [open, initial])

  useEffect(() => {
    if (!open || !form.ay_id) {
      setClasses([])
      return
    }
    let alive = true
    async function load() {
      setLoadingClasses(true)
      try {
        const res = await getClassesByYear(form.ay_id)
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
  }, [open, form.ay_id])

  const selectedClasses = classes.filter((cg) =>
    form.cg_ids.map(String).includes(String(cg.cg_id)),
  )

  async function submit() {
    if (!form.fp_name.trim()) {
      setError('Fee plan name is required.')
      return
    }
    if (!form.fp_type) {
      setError('Fee plan type is required.')
      return
    }
    if (!form.ay_id) {
      setError('Academic year is missing.')
      return
    }

    setSaving(true)
    setError('')
    try {
      const payload = {
        ay_id: Number(form.ay_id),
        fp_name: form.fp_name.trim(),
        fp_type: form.fp_type,
        cg_ids: form.cg_ids.map(Number).filter((id) => id > 0),
      }
      const res = isEdit
        ? await updateFeePlan({ ...payload, fp_id: form.fp_id })
        : await createFeePlan(payload)

      if (Number(res.status) === 200) {
        onSuccess?.(res)
        onClose()
      } else {
        setError(res.message || 'Could not save fee plan.')
      }
    } catch {
      setError(
        isEdit
          ? 'Update API unavailable. Upload APIs/fees/plans/update.php'
          : 'Create API unavailable. Upload APIs/fees/plans/create.php',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle sx={{ pr: 6, fontWeight: 700 }}>
        {isEdit ? 'Edit fee plan' : 'Add fee plan'}
        <IconButton
          aria-label="Close"
          size="small"
          disabled={saving}
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ display: 'grid', gap: 1.25, pt: 1.5 }}>
        <p className="student-action-dialog__note">
          Session: <strong>{form.ay_name || form.ay_id || '—'}</strong>
        </p>

        <TextField
          label="Fee plan name"
          size="small"
          sx={fieldSx}
          value={form.fp_name}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, fp_name: e.target.value }))
          }
        />

        <TextField
          select
          label="Type"
          size="small"
          sx={fieldSx}
          value={form.fp_type}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, fp_type: e.target.value }))
          }
        >
          {typeOptions.map((type) => (
            <MenuItem key={type} value={type}>
              {type}
            </MenuItem>
          ))}
        </TextField>

        <Autocomplete
          multiple
          disableCloseOnSelect
          size="small"
          options={classes}
          value={selectedClasses}
          loading={loadingClasses}
          disabled={!form.ay_id || loadingClasses}
          onChange={(_, next) =>
            setForm((prev) => ({
              ...prev,
              cg_ids: next.map((o) => String(o.cg_id)),
            }))
          }
          getOptionLabel={(opt) => opt.cg_name || ''}
          isOptionEqualToValue={(a, b) => String(a.cg_id) === String(b.cg_id)}
          noOptionsText={
            loadingClasses ? 'Loading classes…' : 'No classes for this year'
          }
          slotProps={popperSx}
          renderOption={(props, option, { selected }) => {
            const { key, ...rest } = props
            return (
              <li key={key} {...rest}>
                <Checkbox
                  icon={icon}
                  checkedIcon={checkedIcon}
                  style={{ marginRight: 8 }}
                  checked={selected}
                />
                {option.cg_name}
              </li>
            )
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Classes"
              placeholder={selectedClasses.length ? '' : 'Select classes'}
              sx={fieldSx}
            />
          )}
          sx={{ width: '100%' }}
        />

        {error ? <p className="student-action-dialog__error">{error}</p> : null}
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1.25 }}>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={submit}
          disabled={saving || !form.fp_name.trim()}
        >
          {saving ? (
            <>
              <CircularProgress size={16} sx={{ mr: 1 }} color="inherit" />
              Saving…
            </>
          ) : isEdit ? (
            'Update'
          ) : (
            'Create'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
