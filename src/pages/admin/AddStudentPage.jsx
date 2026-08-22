import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Alert from '@mui/material/Alert'
import Autocomplete from '@mui/material/Autocomplete'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import MenuItem from '@mui/material/MenuItem'
import Snackbar from '@mui/material/Snackbar'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import Stepper from '@mui/material/Stepper'
import TextField from '@mui/material/TextField'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { getAcademicYears } from '@/services/academicYearApi'
import { getClassesByYear } from '@/services/classesApi'
import { createStudent } from '@/services/studentsApi'
import { formatDobInput, isValidDob } from '@/utils/dobInput'
import { usePincodeLookup } from '@/hooks/usePincodeLookup'

const STEPS = ['Student details', 'Father details', 'Mother details']

const FATHER_OCC = [
  { value: 'none', label: 'None' },
  { value: 'employed', label: 'Employed' },
  { value: 'self-employed', label: 'Self Employed' },
]

const MOTHER_OCC = [
  { value: 'homemaker', label: 'Home-Maker' },
  { value: 'employed', label: 'Employed' },
  { value: 'self-employed', label: 'Self Employed' },
]

const fieldSx = {
  width: '100%',
  bgcolor: '#fff',
  '& .MuiOutlinedInput-root': { borderRadius: '0.65rem' },
}

const popperSx = { popper: { sx: { zIndex: 1400 } } }

const emptyForm = {
  ay_id: '',
  cg_id: '',
  student: {
    first_name: '',
    last_name: '',
    gender: '',
    dob: '',
    roll_no: '',
    bohra: '1',
    its_id: '',
    email: '',
    mobile: '',
    blood_group: '',
    aadhaar: '',
  },
  address: {
    line1: '',
    line2: '',
    city: '',
    state: '',
    country: '',
    pincode: '',
  },
  father: {
    first_name: '',
    last_name: '',
    mobile: '',
    email: '',
    occupation: 'none',
    employer: '',
    designation: '',
    business_name: '',
    business_nature: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    country: '',
    pincode: '',
  },
  mother: {
    first_name: '',
    last_name: '',
    mobile: '',
    email: '',
    occupation: 'homemaker',
    employer: '',
    designation: '',
    business_name: '',
    business_nature: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    country: '',
    pincode: '',
  },
}

function Field({ label, required, optional, error, children }) {
  return (
    <label className={`add-student__field${error ? ' add-student__field--invalid' : ''}`}>
      <span className="add-student__label">
        {label}
        {required ? <em>*</em> : null}
        {optional && !required ? (
          <span className="add-student__optional">optional</span>
        ) : null}
      </span>
      {children}
      {error ? <span className="add-student__field-error">{error}</span> : null}
    </label>
  )
}

function fieldError(errors, key) {
  return errors[key] || ''
}

function getStepErrors(step, form) {
  const errors = {}
  const s = form.student

  if (step === 0) {
    if (!form.ay_id) errors.ay_id = 'Select academic year'
    if (!form.cg_id) errors.cg_id = 'Select class'
    if (!s.first_name.trim()) errors['student.first_name'] = 'Required'
    if (!s.last_name.trim()) errors['student.last_name'] = 'Required'
    if (!s.gender) errors['student.gender'] = 'Required'
    if (!s.roll_no.trim()) errors['student.roll_no'] = 'Required'
    if (!s.its_id.trim()) errors['student.its_id'] = 'Required'
    if (s.dob.trim() && !isValidDob(s.dob.trim())) {
      errors['student.dob'] = 'Use a valid date (DD-MM-YYYY)'
    }
  }

  if (step === 1) {
    if (!form.father.first_name.trim()) errors['father.first_name'] = 'Required'
    if (!form.father.last_name.trim()) errors['father.last_name'] = 'Required'
  }

  if (step === 2) {
    if (!form.mother.first_name.trim()) errors['mother.first_name'] = 'Required'
    if (!form.mother.last_name.trim()) errors['mother.last_name'] = 'Required'
  }

  return errors
}

function PersonStepFields({ prefix, form, setForm, occupationOptions, errors = {} }) {
  const block = form[prefix]
  const occ = block.occupation
  const employed = occ === 'employed'
  const selfEmployed = occ === 'self-employed'

  function set(key, value) {
    setForm((prev) => ({
      ...prev,
      [prefix]: { ...prev[prefix], [key]: value },
    }))
  }

  function setMany(patch) {
    setForm((prev) => ({
      ...prev,
      [prefix]: { ...prev[prefix], ...patch },
    }))
  }

  const { loading: pinLoading, error: pinError } = usePincodeLookup(
    employed || selfEmployed ? block.pincode : '',
    (result) => {
      setMany({
        city: result.city,
        state: result.state,
        country: result.country,
      })
    },
  )

  return (
    <div className="add-student__grid">
      <Field label="First name" required error={fieldError(errors, `${prefix}.first_name`)}>
        <TextField
          size="small"
          sx={fieldSx}
          value={block.first_name}
          error={Boolean(fieldError(errors, `${prefix}.first_name`))}
          onChange={(e) => set('first_name', e.target.value)}
        />
      </Field>
      <Field label="Last name" required error={fieldError(errors, `${prefix}.last_name`)}>
        <TextField
          size="small"
          sx={fieldSx}
          value={block.last_name}
          error={Boolean(fieldError(errors, `${prefix}.last_name`))}
          onChange={(e) => set('last_name', e.target.value)}
        />
      </Field>
      <Field label="Mobile">
        <TextField
          size="small"
          sx={fieldSx}
          value={block.mobile}
          onChange={(e) => set('mobile', e.target.value)}
          inputMode="tel"
        />
      </Field>
      <Field label="Email" optional>
        <TextField
          size="small"
          sx={fieldSx}
          value={block.email}
          onChange={(e) => set('email', e.target.value)}
          type="email"
        />
      </Field>
      <Field label="Occupation" optional>
        <TextField
          select
          size="small"
          sx={fieldSx}
          value={occ}
          onChange={(e) => set('occupation', e.target.value)}
        >
          {occupationOptions.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>
      </Field>

      {employed ? (
        <>
          <Field label="Employer" optional>
            <TextField
              size="small"
              sx={fieldSx}
              value={block.employer}
              onChange={(e) => set('employer', e.target.value)}
            />
          </Field>
          <Field label="Designation" optional>
            <TextField
              size="small"
              sx={fieldSx}
              value={block.designation}
              onChange={(e) => set('designation', e.target.value)}
            />
          </Field>
        </>
      ) : null}

      {selfEmployed ? (
        <>
          <Field label="Business name" optional>
            <TextField
              size="small"
              sx={fieldSx}
              value={block.business_name}
              onChange={(e) => set('business_name', e.target.value)}
            />
          </Field>
          <Field label="Business nature" optional>
            <TextField
              size="small"
              sx={fieldSx}
              value={block.business_nature}
              onChange={(e) => set('business_nature', e.target.value)}
            />
          </Field>
        </>
      ) : null}

      {employed || selfEmployed ? (
        <>
          <Field label="Address line 1" optional>
            <TextField
              size="small"
              sx={fieldSx}
              value={block.address_line1}
              onChange={(e) => set('address_line1', e.target.value)}
            />
          </Field>
          <Field label="Address line 2" optional>
            <TextField
              size="small"
              sx={fieldSx}
              value={block.address_line2}
              onChange={(e) => set('address_line2', e.target.value)}
            />
          </Field>
          <Field label="City" optional>
            <TextField
              size="small"
              sx={fieldSx}
              value={block.city}
              onChange={(e) => set('city', e.target.value)}
            />
          </Field>
          <Field label="State" optional>
            <TextField
              size="small"
              sx={fieldSx}
              value={block.state}
              onChange={(e) => set('state', e.target.value)}
            />
          </Field>
          <Field label="Country" optional>
            <TextField
              size="small"
              sx={fieldSx}
              value={block.country}
              onChange={(e) => set('country', e.target.value)}
            />
          </Field>
          <Field label="Pincode" optional error={pinError}>
            <TextField
              size="small"
              sx={fieldSx}
              value={block.pincode}
              onChange={(e) =>
                set('pincode', e.target.value.replace(/\D+/g, '').slice(0, 6))
              }
              inputMode="numeric"
              placeholder="6-digit PIN"
              helperText={pinLoading ? 'Looking up city / state…' : ' '}
              FormHelperTextProps={{ sx: { minHeight: '1.1em', m: 0 } }}
            />
          </Field>
        </>
      ) : null}
    </div>
  )
}

export default function AddStudentPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(emptyForm)
  const [years, setYears] = useState([])
  const [classes, setClasses] = useState([])
  const [loadingYears, setLoadingYears] = useState(true)
  const [loadingClasses, setLoadingClasses] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState({ open: false, message: '' })

  const allStepErrors = useMemo(
    () => ({
      ...getStepErrors(0, form),
      ...getStepErrors(1, form),
      ...getStepErrors(2, form),
    }),
    [form],
  )

  const canSave = Object.keys(allStepErrors).length === 0
  const onSaveStep = step === STEPS.length - 1
  const showSaveValidation = onSaveStep && !canSave

  const visibleFieldErrors = showSaveValidation ? getStepErrors(step, form) : {}

  const saveWarning = useMemo(() => {
    if (!showSaveValidation) return ''
    const parts = []
    if (Object.keys(getStepErrors(0, form)).length) parts.push('Student details')
    if (Object.keys(getStepErrors(1, form)).length) parts.push('Father details')
    if (Object.keys(getStepErrors(2, form)).length) parts.push('Mother details')
    if (!parts.length) return ''
    return `Complete required fields in: ${parts.join(', ')}. Use Back to fix earlier steps.`
  }, [showSaveValidation, form])

  useEffect(() => {
    let alive = true
    async function loadYears() {
      setLoadingYears(true)
      try {
        const res = await getAcademicYears()
        if (!alive) return
        const list = res.data?.years || []
        setYears(list)
        const current = list.find((y) => y.ay_current) || list[0]
        if (current) {
          setForm((prev) => ({ ...prev, ay_id: String(current.ay_id) }))
        }
      } catch {
        if (alive) setError('Could not load academic years.')
      } finally {
        if (alive) setLoadingYears(false)
      }
    }
    loadYears()
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!form.ay_id) {
      setClasses([])
      return
    }
    let alive = true
    async function loadClasses() {
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
    loadClasses()
    return () => {
      alive = false
    }
  }, [form.ay_id])

  const selectedYear = useMemo(
    () => years.find((y) => String(y.ay_id) === String(form.ay_id)) || null,
    [years, form.ay_id],
  )

  const selectedClass = useMemo(
    () => classes.find((cg) => String(cg.cg_id) === String(form.cg_id)) || null,
    [classes, form.cg_id],
  )

  function setStudent(key, value) {
    setForm((prev) => ({
      ...prev,
      student: { ...prev.student, [key]: value },
    }))
  }

  function setAddress(key, value) {
    setForm((prev) => ({
      ...prev,
      address: { ...prev.address, [key]: value },
    }))
  }

  function setAddressMany(patch) {
    setForm((prev) => ({
      ...prev,
      address: { ...prev.address, ...patch },
    }))
  }

  const { loading: addressPinLoading, error: addressPinError } = usePincodeLookup(
    form.address.pincode,
    (result) => {
      setAddressMany({
        city: result.city,
        state: result.state,
        country: result.country,
      })
    },
  )

  function goNext() {
    setError('')
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  function goBack() {
    setError('')
    setStep((s) => Math.max(s - 1, 0))
  }

  async function submit() {
    if (!canSave) return
    setSubmitting(true)
    setError('')
    try {
      const res = await createStudent({
        cg_id: Number(form.cg_id),
        student: {
          ...form.student,
          bohra: form.student.bohra === '0' ? '0' : '1',
        },
        address: form.address,
        father: form.father,
        mother: form.mother,
      })
      if (Number(res.status) === 200 && res.data?.st_id) {
        setToast({ open: true, message: res.message || 'Student added.' })
        navigate(`/students/${res.data.st_id}`)
      } else {
        setError(res.message || 'Could not save student.')
      }
    } catch {
      setError('Add student API unavailable. Upload APIs/students/create.php')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="module-page add-student-page">
      <header className="add-student-page__head">
        <Button
          size="small"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/students')}
          className="add-student-page__back"
        >
          Back to Students
        </Button>
        <div>
          <h1 className="text-gold-gradient">Add Student</h1>
          <p>Use Next to move between steps. Add student is enabled only when all required fields are filled.</p>
        </div>
      </header>

      <Stepper activeStep={step} className="add-student-page__stepper" alternativeLabel>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {saveWarning ? (
        <Alert severity="warning" className="add-student-page__alert">
          {saveWarning}
        </Alert>
      ) : null}

      {error ? <Alert severity="error" className="add-student-page__alert">{error}</Alert> : null}

      <div className="add-student-page__panel">
        {step === 0 ? (
          <>
            <h2>Student details</h2>
            <div className="add-student__grid">
              <Field label="Academic year" required error={fieldError(visibleFieldErrors, 'ay_id')}>
                <Autocomplete
                  size="small"
                  options={years}
                  value={selectedYear}
                  loading={loadingYears}
                  onChange={(_, next) => {
                    setForm((prev) => ({
                      ...prev,
                      ay_id: next ? String(next.ay_id) : '',
                      cg_id: '',
                    }))
                  }}
                  getOptionLabel={(opt) =>
                    `${opt.ay_name || ''}${opt.ay_current ? ' · Current' : ''}`
                  }
                  isOptionEqualToValue={(a, b) => String(a.ay_id) === String(b.ay_id)}
                  autoHighlight
                  slotProps={popperSx}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Select year"
                      sx={fieldSx}
                      error={Boolean(fieldError(visibleFieldErrors, 'ay_id'))}
                    />
                  )}
                />
              </Field>
              <Field label="Class" required error={fieldError(visibleFieldErrors, 'cg_id')}>
                <Autocomplete
                  size="small"
                  options={classes}
                  value={selectedClass}
                  disabled={!form.ay_id || loadingClasses}
                  loading={loadingClasses}
                  onChange={(_, next) => {
                    setForm((prev) => ({
                      ...prev,
                      cg_id: next ? String(next.cg_id) : '',
                    }))
                  }}
                  getOptionLabel={(opt) => opt.cg_name || ''}
                  isOptionEqualToValue={(a, b) => String(a.cg_id) === String(b.cg_id)}
                  noOptionsText={
                    loadingClasses ? 'Loading…' : 'No classes for this year'
                  }
                  autoHighlight
                  slotProps={popperSx}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Select class"
                      sx={fieldSx}
                      error={Boolean(fieldError(visibleFieldErrors, 'cg_id'))}
                    />
                  )}
                />
              </Field>
              <Field
                label="First name"
                required
                error={fieldError(visibleFieldErrors, 'student.first_name')}
              >
                <TextField
                  size="small"
                  sx={fieldSx}
                  value={form.student.first_name}
                  error={Boolean(fieldError(visibleFieldErrors, 'student.first_name'))}
                  onChange={(e) => setStudent('first_name', e.target.value)}
                />
              </Field>
              <Field
                label="Last name"
                required
                error={fieldError(visibleFieldErrors, 'student.last_name')}
              >
                <TextField
                  size="small"
                  sx={fieldSx}
                  value={form.student.last_name}
                  error={Boolean(fieldError(visibleFieldErrors, 'student.last_name'))}
                  onChange={(e) => setStudent('last_name', e.target.value)}
                />
              </Field>
              <Field
                label="Gender"
                required
                error={fieldError(visibleFieldErrors, 'student.gender')}
              >
                <TextField
                  select
                  size="small"
                  sx={fieldSx}
                  value={form.student.gender}
                  error={Boolean(fieldError(visibleFieldErrors, 'student.gender'))}
                  onChange={(e) => setStudent('gender', e.target.value)}
                >
                  <MenuItem value="">Select</MenuItem>
                  <MenuItem value="M">Male</MenuItem>
                  <MenuItem value="F">Female</MenuItem>
                </TextField>
              </Field>
              <Field
                label="Date of birth"
                optional
                error={fieldError(visibleFieldErrors, 'student.dob')}
              >
                <TextField
                  size="small"
                  sx={fieldSx}
                  placeholder="DD-MM-YYYY"
                  value={form.student.dob}
                  error={Boolean(fieldError(visibleFieldErrors, 'student.dob'))}
                  onChange={(e) => setStudent('dob', formatDobInput(e.target.value))}
                  inputMode="numeric"
                />
              </Field>
              <Field
                label="Roll no"
                required
                error={fieldError(visibleFieldErrors, 'student.roll_no')}
              >
                <TextField
                  size="small"
                  sx={fieldSx}
                  value={form.student.roll_no}
                  error={Boolean(fieldError(visibleFieldErrors, 'student.roll_no'))}
                  onChange={(e) => setStudent('roll_no', e.target.value)}
                />
              </Field>
              <Field label="Bohra" optional>
                <TextField
                  select
                  size="small"
                  sx={fieldSx}
                  value={form.student.bohra || '1'}
                  onChange={(e) => setStudent('bohra', e.target.value)}
                >
                  <MenuItem value="1">Yes (Bohra)</MenuItem>
                  <MenuItem value="0">No (Non Bohra)</MenuItem>
                </TextField>
              </Field>
              <Field
                label="ITS"
                required
                error={fieldError(visibleFieldErrors, 'student.its_id')}
              >
                <TextField
                  size="small"
                  sx={fieldSx}
                  value={form.student.its_id}
                  error={Boolean(fieldError(visibleFieldErrors, 'student.its_id'))}
                  onChange={(e) => setStudent('its_id', e.target.value)}
                />
              </Field>
              <Field label="Email" optional>
                <TextField
                  size="small"
                  sx={fieldSx}
                  type="email"
                  value={form.student.email}
                  onChange={(e) => setStudent('email', e.target.value)}
                />
              </Field>
              <Field label="Mobile">
                <TextField
                  size="small"
                  sx={fieldSx}
                  value={form.student.mobile}
                  onChange={(e) => setStudent('mobile', e.target.value)}
                  inputMode="tel"
                />
              </Field>
              <Field label="Blood group" optional>
                <TextField
                  size="small"
                  sx={fieldSx}
                  value={form.student.blood_group}
                  onChange={(e) => setStudent('blood_group', e.target.value)}
                />
              </Field>
              <Field label="Aadhaar no" optional>
                <TextField
                  size="small"
                  sx={fieldSx}
                  value={form.student.aadhaar}
                  onChange={(e) => setStudent('aadhaar', e.target.value)}
                />
              </Field>
              <Field label="Address line 1">
                <TextField
                  size="small"
                  sx={fieldSx}
                  value={form.address.line1}
                  onChange={(e) => setAddress('line1', e.target.value)}
                />
              </Field>
              <Field label="Address line 2" optional>
                <TextField
                  size="small"
                  sx={fieldSx}
                  value={form.address.line2}
                  onChange={(e) => setAddress('line2', e.target.value)}
                />
              </Field>
              <Field label="City">
                <TextField
                  size="small"
                  sx={fieldSx}
                  value={form.address.city}
                  onChange={(e) => setAddress('city', e.target.value)}
                />
              </Field>
              <Field label="State">
                <TextField
                  size="small"
                  sx={fieldSx}
                  value={form.address.state}
                  onChange={(e) => setAddress('state', e.target.value)}
                />
              </Field>
              <Field label="Country">
                <TextField
                  size="small"
                  sx={fieldSx}
                  value={form.address.country}
                  onChange={(e) => setAddress('country', e.target.value)}
                />
              </Field>
              <Field label="Pincode" optional error={addressPinError}>
                <TextField
                  size="small"
                  sx={fieldSx}
                  value={form.address.pincode}
                  onChange={(e) =>
                    setAddress(
                      'pincode',
                      e.target.value.replace(/\D+/g, '').slice(0, 6),
                    )
                  }
                  inputMode="numeric"
                  placeholder="6-digit PIN"
                  helperText={
                    addressPinLoading ? 'Looking up city / state…' : ' '
                  }
                  FormHelperTextProps={{ sx: { minHeight: '1.1em', m: 0 } }}
                />
              </Field>
            </div>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <h2>Father details</h2>
            <PersonStepFields
              prefix="father"
              form={form}
              setForm={setForm}
              occupationOptions={FATHER_OCC}
              errors={visibleFieldErrors}
            />
          </>
        ) : null}

        {step === 2 ? (
          <>
            <h2>Mother details</h2>
            <PersonStepFields
              prefix="mother"
              form={form}
              setForm={setForm}
              occupationOptions={MOTHER_OCC}
              errors={visibleFieldErrors}
            />
          </>
        ) : null}
      </div>

      <div className="add-student-page__actions">
        <Button disabled={step === 0 || submitting} onClick={goBack}>
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button variant="contained" onClick={goNext}>
            Next
          </Button>
        ) : (
          <Button variant="contained" disabled={submitting || !canSave} onClick={submit}>
            {submitting ? (
              <>
                <CircularProgress size={16} sx={{ mr: 1 }} color="inherit" />
                Saving…
              </>
            ) : (
              'Add student'
            )}
          </Button>
        )}
      </div>

      <Snackbar
        open={toast.open}
        autoHideDuration={2800}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled">
          {toast.message}
        </Alert>
      </Snackbar>
    </section>
  )
}
