import { useEffect, useState } from 'react'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import CloseIcon from '@mui/icons-material/Close'
import { createClass, updateClass } from '@/services/classesApi'

const fieldSx = {
  width: '100%',
  bgcolor: '#fff',
  '& .MuiOutlinedInput-root': { borderRadius: '0.65rem' },
}

const emptyForm = {
  cg_id: null,
  ay_id: '',
  ay_name: '',
  cg_name: '',
  cg_section_number: '',
  cg_order: '',
}

export default function ClassFormDialog({
  open,
  onClose,
  initial = null,
  onSuccess,
}) {
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const isEdit = Boolean(form.cg_id)

  useEffect(() => {
    if (!open) return
    setError('')
    if (initial) {
      setForm({
        cg_id: initial.cg_id || null,
        ay_id: String(initial.ay_id || ''),
        ay_name: initial.ay_name || '',
        cg_name: initial.cg_name || '',
        cg_section_number: initial.cg_section_number ?? '',
        cg_order: initial.cg_order != null ? String(initial.cg_order) : '',
      })
    } else {
      setForm(emptyForm)
    }
  }, [open, initial])

  async function submit() {
    if (!form.cg_name.trim()) {
      setError('Class name is required.')
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
        cg_name: form.cg_name.trim(),
        cg_section_number: form.cg_section_number.trim(),
        cg_order: form.cg_order.trim(),
      }
      const res = isEdit
        ? await updateClass({ ...payload, cg_id: form.cg_id })
        : await createClass(payload)

      if (Number(res.status) === 200) {
        onSuccess?.(res)
        onClose()
      } else {
        setError(res.message || 'Could not save class.')
      }
    } catch {
      setError(
        isEdit
          ? 'Update API unavailable. Upload APIs/classes/update.php'
          : 'Create API unavailable. Upload APIs/classes/create.php',
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
        {isEdit ? 'Edit class' : 'Add class'}
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
          label="Class name"
          size="small"
          sx={fieldSx}
          value={form.cg_name}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, cg_name: e.target.value }))
          }
          placeholder="e.g. Class 1"
        />

        <TextField
          label="Section"
          size="small"
          sx={fieldSx}
          value={form.cg_section_number}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, cg_section_number: e.target.value }))
          }
          placeholder="Optional"
        />

        <TextField
          label="Order"
          size="small"
          sx={fieldSx}
          value={form.cg_order}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, cg_order: e.target.value }))
          }
          placeholder={isEdit ? '' : 'Auto if empty'}
          helperText={
            isEdit
              ? 'Display order within this year'
              : 'Leave empty to auto-assign next order'
          }
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
          disabled={saving || !form.cg_name.trim()}
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
