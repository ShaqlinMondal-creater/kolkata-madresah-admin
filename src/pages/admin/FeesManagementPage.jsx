import { useEffect, useMemo, useState } from 'react'
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
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined'
import { getAcademicYears } from '@/services/academicYearApi'
import { getClassesByYear } from '@/services/classesApi'
import { getFeesList } from '@/services/feesApi'
import ClassMultiSelect from '@/components/forms/ClassMultiSelect'

const defaultFilters = {
  search: '',
  ay_id: '',
  cg_id: [],
  status: '',
  due_from: '',
  due_to: '',
  page: 1,
  perpage: 10,
}

const fieldSx = { width: '100%', bgcolor: '#fff' }
const smFieldSx = {
  width: '100%',
  maxWidth: 138,
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
          return <span className="fees-filters__ph">{emptyLabel}</span>
        }
        const key = String(selected)
        return labels[key] ?? labels[selected] ?? selected
      },
    },
  }
}

function formatInr(amount) {
  return Number(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

function FeeRowMenu({ fee, onAction }) {
  const [anchorEl, setAnchorEl] = useState(null)
  const open = Boolean(anchorEl)

  return (
    <>
      <IconButton
        size="small"
        aria-label={`Actions for fee ${fee.f_id}`}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={(e) => setAnchorEl(e.currentTarget)}
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
            onAction('view', fee)
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
            onAction('update', fee)
          }}
        >
          <ListItemIcon>
            <EditOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Update</ListItemText>
        </MenuItem>
      </Menu>
    </>
  )
}

export default function FeesManagementPage() {
  const [years, setYears] = useState([])
  const [classes, setClasses] = useState([])
  const [filters, setFilters] = useState(defaultFilters)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [rows, setRows] = useState([])
  const [meta, setMeta] = useState({ page: 1, pages: 1, perpage: 10, total: 0 })
  const [loadingYears, setLoadingYears] = useState(true)
  const [loadingClasses, setLoadingClasses] = useState(false)
  const [loading, setLoading] = useState(false)
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
        ay_id: filters.ay_id,
        cg_id: filters.cg_id,
        status: filters.status,
        due_from: filters.due_from,
        due_to: filters.due_to,
        page: filters.page,
        perpage: filters.perpage,
      }),
    [
      debouncedSearch,
      filters.ay_id,
      filters.cg_id,
      filters.status,
      filters.due_from,
      filters.due_to,
      filters.page,
      filters.perpage,
    ],
  )

  useEffect(() => {
    const query = JSON.parse(queryKey)
    if (!query.ay_id) return

    let alive = true
    async function loadFees() {
      setLoading(true)
      setError('')
      try {
        const res = await getFeesList(query)
        if (!alive) return
        if (Number(res.status) === 200 && res.data) {
          setRows(res.data.fees || [])
          setMeta(res.data.meta || { page: 1, pages: 1, perpage: 10, total: 0 })
          setSelectedIds([])
        } else {
          setRows([])
          setError(res.message || 'Could not load fees.')
        }
      } catch {
        if (alive) {
          setRows([])
          setError(
            'Fees API is unavailable. Please upload APIs/fees/list.php and try again.',
          )
        }
      } finally {
        if (alive) setLoading(false)
      }
    }
    loadFees()
    return () => {
      alive = false
    }
  }, [queryKey])

  const pageIds = useMemo(() => rows.map((row) => String(row.f_id)), [rows])
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

  function onRowAction(action, fee) {
    const label = fee.fpp_name || `Fee #${fee.f_id}`
    if (action === 'view') {
      showComingSoon(`View details for “${label}” is coming soon.`)
      return
    }
    showComingSoon(`Update for “${label}” is coming soon.`)
  }

  function onBulkAction(action) {
    setBulkAnchor(null)
    if (!selectedIds.length) {
      showComingSoon('Select at least one fee payment for bulk export.')
      return
    }
    const count = selectedIds.length
    if (action === 'excel') {
      showComingSoon(`Export Excel for ${count} fee payment(s) is coming soon.`)
      return
    }
    showComingSoon(`Export PDF for ${count} fee payment(s) is coming soon.`)
  }

  const colSpan = 13

  return (
    <section className="module-page fees-page">
      <header className="fees-page__head">
        <div>
          <h1 className="text-gold-gradient">Fees Management</h1>
        </div>
        <div className="fees-page__toolbar">
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
            <MenuItem onClick={() => onBulkAction('excel')}>
              <ListItemIcon>
                <FileDownloadOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Export Excel</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => onBulkAction('pdf')}>
              <ListItemIcon>
                <PictureAsPdfOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Export PDF</ListItemText>
            </MenuItem>
          </Menu>
        </div>
      </header>

      <div className="fees-filters">
        <div className="fees-filters__row fees-filters__row--main">
          <TextField
            className="fees-filters__field--name"
            sx={fieldSx}
            value={filters.search}
            onChange={(e) => setField('search', e.target.value)}
            placeholder="Name or roll no"
            inputProps={{ 'aria-label': 'Name or roll no' }}
          />

          <div className="fees-filters__field--class">
            <ClassMultiSelect
              options={classes}
              value={filters.cg_id}
              disabled={loadingClasses || !filters.ay_id}
              placeholder="Class"
              onChange={(cg_id) => setField('cg_id', cg_id)}
            />
          </div>

          <TextField
            select
            sx={fieldSx}
            value={filters.status}
            onChange={(e) => setField('status', e.target.value)}
            slotProps={selectSlotProps('Status', {
              pending: 'Pending',
              paid: 'Paid',
            })}
            inputProps={{ 'aria-label': 'Status' }}
          >
            <MenuItem value="">
              <em>Status</em>
            </MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="paid">Paid</MenuItem>
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
                      <span className="fees-filters__ph">Academic year</span>
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

        <div className="fees-filters__row fees-filters__row--dates">
          <TextField
            className="fees-filters__field--date"
            sx={smFieldSx}
            type="date"
            value={filters.due_from}
            onChange={(e) => setField('due_from', e.target.value)}
            inputProps={{ 'aria-label': 'Due date from', title: 'Due from' }}
          />
          <TextField
            className="fees-filters__field--date"
            sx={smFieldSx}
            type="date"
            value={filters.due_to}
            onChange={(e) => setField('due_to', e.target.value)}
            inputProps={{ 'aria-label': 'Due date to', title: 'Due to' }}
          />
          <div className="fees-filters__actions">
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

      {error ? <p className="fees-page__error">{error}</p> : null}

      <div className="fees-table-wrap">
        {loading ? <LinearProgress className="fees-table__progress" /> : null}

        <table className="fees-table">
          <thead>
            <tr>
              <th className="fees-table__check">
                <Checkbox
                  size="small"
                  checked={allPageSelected}
                  indeterminate={somePageSelected}
                  onChange={(e) => toggleAllPage(e.target.checked)}
                  inputProps={{ 'aria-label': 'Select all fees on this page' }}
                  disabled={!pageIds.length || loading}
                />
              </th>
              <th>SN</th>
              <th>Name</th>
              <th>Roll no</th>
              <th>Class</th>
              <th>Fee</th>
              <th>Due date</th>
              <th>Paid date</th>
              <th>Amount</th>
              <th>Late fee</th>
              <th>Total</th>
              <th>Status</th>
              <th className="fees-table__action">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="fees-table__empty">
                  <span className="fees-table__loading">
                    <CircularProgress size={22} thickness={4} />
                    Loading fees…
                  </span>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="fees-table__empty">
                  No fee payments found for these filters.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const id = String(row.f_id)
                const checked = selectedIds.includes(id)
                return (
                  <tr
                    key={row.f_id}
                    className={[
                      loading ? 'is-loading' : '',
                      checked ? 'is-selected' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <td className="fees-table__check">
                      <Checkbox
                        size="small"
                        checked={checked}
                        onChange={(e) => toggleOne(id, e.target.checked)}
                        inputProps={{
                          'aria-label': `Select fee ${row.fpp_name || row.f_id}`,
                        }}
                      />
                    </td>
                    <td>{row.sn}</td>
                    <td>
                      <div className="fees-table__name">
                        <strong>{row.name || '—'}</strong>
                        {row.its_id ? <span>ITS {row.its_id}</span> : null}
                      </div>
                    </td>
                    <td>{row.roll_no || '—'}</td>
                    <td>{row.class_name || '—'}</td>
                    <td>{row.fpp_name || '—'}</td>
                    <td>{row.fpp_due_date || '—'}</td>
                    <td>{row.f_paid_date || '—'}</td>
                    <td className="fees-table__amt">
                      {formatInr(row.fee_amount_net)}
                    </td>
                    <td className="fees-table__amt">
                      {formatInr(row.late_fee_applicable)}
                    </td>
                    <td className="fees-table__amt">
                      {formatInr(row.total_amount)}
                    </td>
                    <td>
                      <span className={`pill pill--fee-${row.status}`}>
                        {row.status_label}
                      </span>
                    </td>
                    <td className="fees-table__action">
                      <FeeRowMenu fee={row} onAction={onRowAction} />
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <TablePagination
        className="fees-pager"
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
