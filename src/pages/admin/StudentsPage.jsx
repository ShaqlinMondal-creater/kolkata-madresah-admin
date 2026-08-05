import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Checkbox from '@mui/material/Checkbox'
import Menu from '@mui/material/Menu'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import CircularProgress from '@mui/material/CircularProgress'
import LinearProgress from '@mui/material/LinearProgress'
import TablePagination from '@mui/material/TablePagination'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import UpgradeOutlinedIcon from '@mui/icons-material/UpgradeOutlined'
import SwapHorizOutlinedIcon from '@mui/icons-material/SwapHorizOutlined'
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import RequestQuoteOutlinedIcon from '@mui/icons-material/RequestQuoteOutlined'
import { getAcademicYears } from '@/services/academicYearApi'
import { getClassesByYear } from '@/services/classesApi'
import { getStudentsList } from '@/services/studentsApi'
import ClassMultiSelect from '@/components/forms/ClassMultiSelect'
import { useSwitchToStudent } from '@/hooks/useSwitchToStudent'

const defaultFilters = {
  search: '',
  st_on_roll: '1',
  ay_id: '',
  st_bohra: '',
  cg_id: [],
  st_gender: '',
  dob_from: '',
  dob_to: '',
  page: 1,
  perpage: 10,
}

const fieldSx = { width: '100%', bgcolor: '#fff' }
const smFieldSx = {
  width: '100%',
  maxWidth: 126,
  bgcolor: '#fff',
  '& input': { fontSize: '0.85rem' },
}

function selectSlotProps(emptyLabel, labels = {}) {
  return {
    select: {
      displayEmpty: true,
      renderValue: (selected) => {
        const isEmpty =
          selected === '' || selected === null || selected === undefined
        if (isEmpty) {
          if (Object.prototype.hasOwnProperty.call(labels, '')) {
            return labels['']
          }
          return <span className="students-filters__ph">{emptyLabel}</span>
        }
        const key = String(selected)
        return labels[key] ?? labels[selected] ?? selected
      },
    },
  }
}

function StudentRowMenu({ student, onAction }) {
  const [anchorEl, setAnchorEl] = useState(null)
  const open = Boolean(anchorEl)

  return (
    <>
      <IconButton
        size="small"
        aria-label={`Actions for ${student.name || 'student'}`}
        aria-controls={open ? `student-row-menu-${student.st_id}` : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={(e) => setAnchorEl(e.currentTarget)}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu
        id={`student-row-menu-${student.st_id}`}
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem
          onClick={() => {
            setAnchorEl(null)
            onAction('view', student)
          }}
        >
          <ListItemIcon>
            <VisibilityOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View details</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchorEl(null)
            onAction('switch', student)
          }}
        >
          <ListItemIcon>
            <SwapHorizOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Switch</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchorEl(null)
            onAction('edit', student)
          }}
        >
          <ListItemIcon>
            <EditOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchorEl(null)
            onAction('upgrade', student)
          }}
        >
          <ListItemIcon>
            <UpgradeOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Upgrade</ListItemText>
        </MenuItem>
      </Menu>
    </>
  )
}

export default function StudentsPage() {
  const navigate = useNavigate()
  const { switching, doSwitch } = useSwitchToStudent()
  const [years, setYears] = useState([])
  const [classes, setClasses] = useState([])
  const [filters, setFilters] = useState(defaultFilters)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [students, setStudents] = useState([])
  const [meta, setMeta] = useState({ page: 1, pages: 1, perpage: 10, total: 0 })
  const [loadingYears, setLoadingYears] = useState(true)
  const [loadingClasses, setLoadingClasses] = useState(false)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [error, setError] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [bulkAnchor, setBulkAnchor] = useState(null)
  const [toast, setToast] = useState({ open: false, message: '' })

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filters.search.trim()), 400)
    return () => clearTimeout(t)
  }, [filters.search])

  useEffect(() => {
    let alive = true
    async function loadYears() {
      setLoadingYears(true)
      try {
        const res = await getAcademicYears()
        if (!alive) return
        if (Number(res.status) === 200 && res.data?.years) {
          setYears(res.data.years)
          const defaultId = String(
            res.data.current_ay_id || res.data.years[0]?.ay_id || '',
          )
          setFilters({
            ...defaultFilters,
            ay_id: defaultId,
            st_on_roll: '1',
          })
        } else {
          setError(res.message || 'Could not load academic seasons.')
        }
      } catch {
        if (alive) setError('Season list is unavailable.')
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
    if (!filters.ay_id) {
      setClasses([])
      return
    }
    let alive = true
    async function loadClasses() {
      setLoadingClasses(true)
      try {
        const res = await getClassesByYear(filters.ay_id)
        if (!alive) return
        if (Number(res.status) === 200) {
          setClasses(res.data?.classes || [])
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
  }, [filters.ay_id])

  const queryKey = useMemo(
    () =>
      JSON.stringify({
        search: debouncedSearch,
        st_on_roll: filters.st_on_roll,
        ay_id: filters.ay_id,
        st_bohra: filters.st_bohra,
        cg_id: filters.cg_id,
        st_gender: filters.st_gender,
        dob_from: filters.dob_from,
        dob_to: filters.dob_to,
        page: filters.page,
        perpage: filters.perpage,
      }),
    [
      debouncedSearch,
      filters.st_on_roll,
      filters.ay_id,
      filters.st_bohra,
      filters.cg_id,
      filters.st_gender,
      filters.dob_from,
      filters.dob_to,
      filters.page,
      filters.perpage,
    ],
  )

  useEffect(() => {
    const query = JSON.parse(queryKey)
    if (!query.ay_id) return

    let alive = true
    async function loadStudents() {
      setLoadingStudents(true)
      setError('')
      try {
        const res = await getStudentsList(query)
        if (!alive) return
        if (Number(res.status) === 200 && res.data) {
          setStudents(res.data.students || [])
          setMeta(res.data.meta || { page: 1, pages: 1, perpage: 10, total: 0 })
          setSelectedIds([])
        } else {
          setStudents([])
          setError(res.message || 'Could not load students.')
        }
      } catch {
        if (alive) {
          setStudents([])
          setError('Students API is unavailable. Please try again.')
        }
      } finally {
        if (alive) setLoadingStudents(false)
      }
    }
    loadStudents()
    return () => {
      alive = false
    }
  }, [queryKey])

  const pageIds = useMemo(
    () => students.map((st) => String(st.st_id)),
    [students],
  )

  const allPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id))
  const somePageSelected =
    pageIds.some((id) => selectedIds.includes(id)) && !allPageSelected

  function setField(name, value) {
    setFilters((prev) => {
      const next = { ...prev, [name]: value }
      if (name !== 'page' && name !== 'perpage') next.page = 1
      if (name === 'ay_id') next.cg_id = []
      return next
    })
  }

  function resetFilters() {
    const ay =
      years.find((y) => y.ay_current)?.ay_id ||
      years[0]?.ay_id ||
      filters.ay_id
    setFilters({
      ...defaultFilters,
      ay_id: String(ay || ''),
      st_on_roll: '1',
      cg_id: [],
    })
    setDebouncedSearch('')
  }

  function showComingSoon(message) {
    setToast({ open: true, message })
  }

  function toggleAllPage(checked) {
    if (checked) {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])))
    } else {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)))
    }
  }

  function toggleOne(id, checked) {
    const key = String(id)
    setSelectedIds((prev) =>
      checked ? Array.from(new Set([...prev, key])) : prev.filter((x) => x !== key),
    )
  }

  async function onRowAction(action, student) {
    if (action === 'view') {
      navigate(`/students/${student.st_id}`)
      return
    }
    if (action === 'switch') {
      const ok = await doSwitch(student.st_id)
      if (!ok) {
        showComingSoon(
          `Could not switch to “${student.name || student.st_id}”. Check Switch API upload.`,
        )
      }
      return
    }
    const name = student.name || `student #${student.st_id}`
    const labels = {
      edit: `Edit “${name}” is coming soon.`,
      upgrade: `Upgrade “${name}” is coming soon.`,
    }
    showComingSoon(labels[action] || 'Coming soon.')
  }

  function onBulkAction(action) {
    setBulkAnchor(null)
    if (!selectedIds.length) {
      showComingSoon('Select at least one student for bulk actions.')
      return
    }
    const count = selectedIds.length
    const labels = {
      export: `Export Excel for ${count} student(s) is coming soon.`,
      fee_plan: `Apply fee plan for ${count} student(s) is coming soon.`,
      upgrade: `Upgrade for ${count} student(s) is coming soon.`,
    }
    showComingSoon(labels[action] || 'Coming soon.')
  }

  const colSpan = 11

  return (
    <section className="module-page students-page">
      <header className="students-page__head">
        <div>
          <h1 className="text-gold-gradient">Students</h1>
        </div>
        <div className="students-page__head-actions">
          <div className="students-page__toolbar">
            <Button
              variant="contained"
              color="primary"
              startIcon={<PersonAddAlt1Icon />}
              onClick={() => showComingSoon('Add student is coming soon.')}
            >
              Add student
            </Button>
            <Button
              variant="outlined"
              endIcon={<KeyboardArrowDownIcon />}
              onClick={(e) => setBulkAnchor(e.currentTarget)}
              aria-haspopup="true"
              aria-expanded={Boolean(bulkAnchor) ? 'true' : undefined}
            >
              Bulk action
              {selectedIds.length ? ` (${selectedIds.length})` : ''}
            </Button>
            <Menu
              anchorEl={bulkAnchor}
              open={Boolean(bulkAnchor)}
              onClose={() => setBulkAnchor(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <MenuItem onClick={() => onBulkAction('export')}>
                <ListItemIcon>
                  <FileDownloadOutlinedIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Export Excel</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => onBulkAction('fee_plan')}>
                <ListItemIcon>
                  <RequestQuoteOutlinedIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Apply fee plan</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => onBulkAction('upgrade')}>
                <ListItemIcon>
                  <UpgradeOutlinedIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Upgrade</ListItemText>
              </MenuItem>
            </Menu>
          </div>
        </div>
      </header>

      <div className="students-filters">
        <div className="students-filters__row students-filters__row--primary">
          <TextField
            className="students-filters__field--name"
            sx={fieldSx}
            value={filters.search}
            onChange={(e) => setField('search', e.target.value)}
            placeholder="Name or roll no"
            inputProps={{ 'aria-label': 'Name or roll no' }}
          />

          <TextField
            select
            sx={fieldSx}
            value={filters.st_on_roll}
            onChange={(e) => setField('st_on_roll', e.target.value)}
            slotProps={selectSlotProps('Roll type', {
              1: 'On-roll',
              0: 'Off-roll',
              '': 'All roll types',
            })}
            inputProps={{ 'aria-label': 'Roll type' }}
          >
            <MenuItem value="1">On-roll</MenuItem>
            <MenuItem value="0">Off-roll</MenuItem>
            <MenuItem value="">All roll types</MenuItem>
          </TextField>

          <TextField
            select
            sx={fieldSx}
            value={filters.st_bohra}
            onChange={(e) => setField('st_bohra', e.target.value)}
            slotProps={selectSlotProps('Is Bohra', {
              1: 'Bohra',
              0: 'Non Bohra',
            })}
            inputProps={{ 'aria-label': 'Is Bohra' }}
          >
            <MenuItem value="">
              <em>Is Bohra</em>
            </MenuItem>
            <MenuItem value="1">Bohra</MenuItem>
            <MenuItem value="0">Non Bohra</MenuItem>
          </TextField>

          <TextField
            select
            className="students-filters__field--sm"
            sx={smFieldSx}
            value={filters.st_gender}
            onChange={(e) => setField('st_gender', e.target.value)}
            slotProps={selectSlotProps('Gender', {
              M: 'Male',
              F: 'Female',
            })}
            inputProps={{ 'aria-label': 'Gender' }}
          >
            <MenuItem value="">
              <em>Gender</em>
            </MenuItem>
            <MenuItem value="M">Male</MenuItem>
            <MenuItem value="F">Female</MenuItem>
          </TextField>

          <TextField
            select
            sx={fieldSx}
            value={filters.ay_id}
            onChange={(e) => setField('ay_id', e.target.value)}
            disabled={loadingYears}
            slotProps={{
              select: {
                displayEmpty: true,
                renderValue: (selected) => {
                  if (!selected) {
                    return (
                      <span className="students-filters__ph">Academic year</span>
                    )
                  }
                  const y = years.find(
                    (item) => String(item.ay_id) === String(selected),
                  )
                  if (!y) return selected
                  return `${y.ay_name}${y.ay_current ? ' · Current' : ''}`
                },
              },
            }}
            inputProps={{ 'aria-label': 'Academic year' }}
          >
            <MenuItem value="">Academic year</MenuItem>
            {years.map((y) => (
              <MenuItem key={y.ay_id} value={String(y.ay_id)}>
                {y.ay_name}
                {y.ay_current ? ' · Current' : ''}
              </MenuItem>
            ))}
          </TextField>
        </div>

        <div className="students-filters__row students-filters__row--secondary">
          <TextField
            className="students-filters__field--sm"
            sx={smFieldSx}
            type="date"
            value={filters.dob_from}
            onChange={(e) => setField('dob_from', e.target.value)}
            inputProps={{ 'aria-label': 'DOB from', title: 'DOB from' }}
          />

          <TextField
            className="students-filters__field--sm"
            sx={smFieldSx}
            type="date"
            value={filters.dob_to}
            onChange={(e) => setField('dob_to', e.target.value)}
            inputProps={{ 'aria-label': 'DOB to', title: 'DOB to' }}
          />

          <div className="students-filters__field--class">
            <ClassMultiSelect
              options={classes}
              value={filters.cg_id}
              disabled={loadingClasses || !filters.ay_id}
              placeholder="Class"
              onChange={(cg_id) => setField('cg_id', cg_id)}
            />
          </div>

          <div className="students-filters__actions">
            <Tooltip title="Reset filters">
              <IconButton
                aria-label="Reset filters"
                onClick={resetFilters}
                color="primary"
                size="small"
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: '#fff',
                  borderRadius: 1,
                  width: 40,
                  height: 40,
                }}
              >
                <RestartAltIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </div>
        </div>
      </div>

      {error ? <p className="students-page__error">{error}</p> : null}

      <div className="students-table-wrap">
        {loadingStudents ? (
          <LinearProgress className="students-table__progress" />
        ) : null}

        <table className="students-table">
          <thead>
            <tr>
              <th className="students-table__check">
                <Checkbox
                  size="small"
                  checked={allPageSelected}
                  indeterminate={somePageSelected}
                  onChange={(e) => toggleAllPage(e.target.checked)}
                  inputProps={{ 'aria-label': 'Select all students on this page' }}
                  disabled={!pageIds.length || loadingStudents}
                />
              </th>
              <th>SN</th>
              <th>Name</th>
              <th>Roll no</th>
              <th>Class</th>
              <th>Gender</th>
              <th>DOB</th>
              <th>Bohra</th>
              <th>Status</th>
              <th>Mobile</th>
              <th className="students-table__action">Action</th>
            </tr>
          </thead>
          <tbody>
            {loadingStudents && students.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="students-table__empty">
                  <span className="students-table__loading">
                    <CircularProgress size={22} thickness={4} />
                    Loading students…
                  </span>
                </td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="students-table__empty">
                  No students found for these filters.
                </td>
              </tr>
            ) : (
              students.map((st) => {
                const id = String(st.st_id)
                const checked = selectedIds.includes(id)
                return (
                  <tr
                    key={st.st_id}
                    className={[
                      loadingStudents ? 'is-loading' : '',
                      checked ? 'is-selected' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <td className="students-table__check">
                      <Checkbox
                        size="small"
                        checked={checked}
                        onChange={(e) => toggleOne(id, e.target.checked)}
                        inputProps={{
                          'aria-label': `Select ${st.name || 'student'}`,
                        }}
                      />
                    </td>
                    <td>{st.sn}</td>
                    <td>
                      <div className="students-table__name">
                        <button
                          type="button"
                          className="students-table__name-btn"
                          onClick={() => navigate(`/students/${st.st_id}`)}
                        >
                          <strong>{st.name || '—'}</strong>
                        </button>
                        {st.its_id ? <span>ITS {st.its_id}</span> : null}
                      </div>
                    </td>
                    <td>{st.roll_no || '—'}</td>
                    <td>{st.class_name || '—'}</td>
                    <td>{st.gender || '—'}</td>
                    <td>{st.dob || '—'}</td>
                    <td>
                      <span
                        className={`pill ${st.is_bohra ? 'pill--yes' : 'pill--no'}`}
                      >
                        {st.is_bohra ? 'Bohra' : 'Non Bohra'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`pill ${st.on_roll ? 'pill--on' : 'pill--off'}`}
                      >
                        {st.on_roll ? 'On-roll' : 'Off-roll'}
                      </span>
                    </td>
                    <td>{st.mobile || '—'}</td>
                    <td className="students-table__action">
                      <StudentRowMenu student={st} onAction={onRowAction} />
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <TablePagination
        className="students-pager"
        component="div"
        count={meta.total || 0}
        page={Math.max(0, (filters.page || 1) - 1)}
        onPageChange={(_, newPage) => setField('page', newPage + 1)}
        rowsPerPage={filters.perpage}
        onRowsPerPageChange={(e) => {
          setFilters((prev) => ({
            ...prev,
            perpage: Number(e.target.value),
            page: 1,
          }))
        }}
        rowsPerPageOptions={[10, 20, 50, 100]}
        labelRowsPerPage="Rows per page:"
      />

      <Snackbar
        open={toast.open}
        autoHideDuration={3200}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="info"
          variant="filled"
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </section>
  )
}
