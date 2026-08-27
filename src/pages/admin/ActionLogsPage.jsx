import { useEffect, useMemo, useState } from 'react'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import CircularProgress from '@mui/material/CircularProgress'
import LinearProgress from '@mui/material/LinearProgress'
import TablePagination from '@mui/material/TablePagination'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import CloseIcon from '@mui/icons-material/Close'
import {
  getActionLogDetails,
  getActionLogsList,
} from '@/services/actionLogsApi'

const defaultFilters = {
  q: '',
  module: '',
  action: '',
  username: '',
  status: '',
  date_from: '',
  date_to: '',
  page: 1,
  perpage: 20,
}

const fieldSx = { width: '100%', bgcolor: '#fff' }
const smFieldSx = {
  width: '100%',
  maxWidth: 138,
  bgcolor: '#fff',
  '& input': { fontSize: '0.85rem' },
}

function DetailRow({ label, value, full = false }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div className={`txn-detail__row${full ? ' is-full' : ''}`}>
      <span>{label}</span>
      <em>:</em>
      <strong>{value}</strong>
    </div>
  )
}

function formatJsonBody(value) {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

export default function ActionLogsPage() {
  const [filters, setFilters] = useState(defaultFilters)
  const [debouncedQ, setDebouncedQ] = useState('')
  const [rows, setRows] = useState([])
  const [meta, setMeta] = useState({ page: 1, pages: 1, perpage: 20, total: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState('')
  const [details, setDetails] = useState(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(filters.q.trim()), 400)
    return () => clearTimeout(t)
  }, [filters.q])

  const queryKey = useMemo(
    () =>
      JSON.stringify({
        q: debouncedQ,
        module: filters.module.trim(),
        action: filters.action.trim(),
        username: filters.username.trim(),
        status: filters.status.trim(),
        date_from: filters.date_from,
        date_to: filters.date_to,
        page: filters.page,
        perpage: filters.perpage,
      }),
    [
      debouncedQ,
      filters.module,
      filters.action,
      filters.username,
      filters.status,
      filters.date_from,
      filters.date_to,
      filters.page,
      filters.perpage,
    ],
  )

  useEffect(() => {
    const query = JSON.parse(queryKey)
    let alive = true

    async function loadList() {
      setLoading(true)
      setError('')
      try {
        const res = await getActionLogsList(query)
        if (!alive) return
        if (Number(res.status) === 200 && res.data) {
          setRows(res.data.logs || [])
          setMeta(res.data.meta || { page: 1, pages: 1, perpage: 20, total: 0 })
        } else {
          setRows([])
          setError(res.message || 'Could not load action logs.')
        }
      } catch {
        if (alive) {
          setRows([])
          setError(
            'Action Logs API is unavailable. Please upload APIs/action-logs/ and try again.',
          )
        }
      } finally {
        if (alive) setLoading(false)
      }
    }

    loadList()
    return () => {
      alive = false
    }
  }, [queryKey])

  function setField(name, value) {
    setFilters((prev) => {
      const next = { ...prev, [name]: value }
      if (name !== 'page' && name !== 'perpage') next.page = 1
      return next
    })
  }

  function resetFilters() {
    setFilters({ ...defaultFilters })
    setDebouncedQ('')
  }

  async function openDetails(row) {
    setDetailsOpen(true)
    setDetails(null)
    setDetailsError('')
    setDetailsLoading(true)
    try {
      const res = await getActionLogDetails(row.id)
      if (Number(res.status) === 200 && res.data) {
        setDetails(res.data)
      } else {
        setDetailsError(res.message || 'Could not load action log details.')
      }
    } catch {
      setDetailsError('Action log details API is unavailable.')
    } finally {
      setDetailsLoading(false)
    }
  }

  const colSpan = 8

  return (
    <section className="module-page txn-page">
      <header className="txn-page__head">
        <div>
          <h1 className="text-gold-gradient">Action Logs</h1>
        </div>
      </header>

      <div className="txn-filters">
        <div className="txn-filters__row">
          <TextField
            className="txn-filters__field--name"
            sx={fieldSx}
            value={filters.q}
            onChange={(e) => setField('q', e.target.value)}
            placeholder="Search action / message / user"
            inputProps={{ 'aria-label': 'Search action logs' }}
          />

          <TextField
            sx={fieldSx}
            value={filters.module}
            onChange={(e) => setField('module', e.target.value)}
            placeholder="Module"
            inputProps={{ 'aria-label': 'Module' }}
          />

          <TextField
            sx={fieldSx}
            value={filters.action}
            onChange={(e) => setField('action', e.target.value)}
            placeholder="Action"
            inputProps={{ 'aria-label': 'Action' }}
          />

          <TextField
            sx={fieldSx}
            value={filters.username}
            onChange={(e) => setField('username', e.target.value)}
            placeholder="Username"
            inputProps={{ 'aria-label': 'Username' }}
          />

          <TextField
            sx={smFieldSx}
            value={filters.status}
            onChange={(e) => setField('status', e.target.value)}
            placeholder="Status"
            inputProps={{ 'aria-label': 'Status' }}
          />

          <TextField
            className="txn-filters__field--date"
            sx={smFieldSx}
            type="date"
            value={filters.date_from}
            onChange={(e) => setField('date_from', e.target.value)}
            inputProps={{ 'aria-label': 'Date from', title: 'Date from' }}
          />

          <TextField
            className="txn-filters__field--date"
            sx={smFieldSx}
            type="date"
            value={filters.date_to}
            onChange={(e) => setField('date_to', e.target.value)}
            inputProps={{ 'aria-label': 'Date to', title: 'Date to' }}
          />

          <div className="txn-filters__actions">
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

      {error ? <p className="txn-page__error">{error}</p> : null}

      <div className="txn-table-wrap">
        {loading ? <LinearProgress className="txn-table__progress" /> : null}

        <table className="txn-table">
          <thead>
            <tr>
              <th>#</th>
              <th>When</th>
              <th>Action</th>
              <th>Module</th>
              <th>User</th>
              <th>Message</th>
              <th>Status</th>
              <th className="txn-table__action">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="txn-table__empty">
                  <span className="txn-table__loading">
                    <CircularProgress size={22} thickness={4} />
                    Loading action logs…
                  </span>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="txn-table__empty">
                  No action logs found for these filters.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className={loading ? 'is-loading' : undefined}
                >
                  <td>{row.sn || row.id}</td>
                  <td>{row.created_at || '—'}</td>
                  <td>
                    <strong>{row.action || '—'}</strong>
                  </td>
                  <td>{row.module || '—'}</td>
                  <td>
                    <div className="txn-table__name">
                      <strong>{row.username || '—'}</strong>
                      <span>{row.userlevel || '—'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="txn-table__narration">
                      <strong>{row.message || '—'}</strong>
                      {row.ip ? <span>{row.ip}</span> : null}
                    </div>
                  </td>
                  <td>
                    <span className="pill">{row.status || '—'}</span>
                  </td>
                  <td className="txn-table__action">
                    <Tooltip title="Details">
                      <IconButton
                        size="small"
                        aria-label={`Details for log ${row.id}`}
                        onClick={() => openDetails(row)}
                      >
                        <VisibilityOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <TablePagination
        className="txn-pager"
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

      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle
          sx={{
            pr: 6,
            py: 1.1,
            px: 1.5,
            fontSize: '1.05rem',
            fontWeight: 700,
          }}
        >
          Action log details
          {details?.id ? ` #${details.id}` : ''}
          <IconButton
            aria-label="Close"
            size="small"
            onClick={() => setDetailsOpen(false)}
            sx={{ position: 'absolute', right: 6, top: 6 }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ px: 1.5, py: 1.5 }}>
          {detailsLoading ? (
            <span className="txn-table__loading">
              <CircularProgress size={22} thickness={4} />
              Loading details…
            </span>
          ) : detailsError ? (
            <p className="txn-page__error">{detailsError}</p>
          ) : details ? (
            <div className="txn-detail">
              <DetailRow label="Action" value={details.action} />
              <DetailRow label="Module" value={details.module} />
              <DetailRow label="Username" value={details.username} />
              <DetailRow label="Userlevel" value={details.userlevel} />
              <DetailRow
                label="Student ID"
                value={details.st_id != null ? String(details.st_id) : ''}
              />
              <DetailRow label="Status" value={details.status} />
              <DetailRow label="IP" value={details.ip} />
              <DetailRow label="When" value={details.created_at} />
              <DetailRow label="Message" value={details.message} full />
              <div className="txn-detail__row is-full">
                <span>Request</span>
                <em>:</em>
                <strong>
                  <pre
                    style={{
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontFamily: 'ui-monospace, Consolas, monospace',
                      fontSize: '0.78rem',
                      fontWeight: 500,
                    }}
                  >
                    {formatJsonBody(details.request)}
                  </pre>
                </strong>
              </div>
              <div className="txn-detail__row is-full">
                <span>Response</span>
                <em>:</em>
                <strong>
                  <pre
                    style={{
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontFamily: 'ui-monospace, Consolas, monospace',
                      fontSize: '0.78rem',
                      fontWeight: 500,
                    }}
                  >
                    {formatJsonBody(details.response)}
                  </pre>
                </strong>
              </div>
            </div>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 1.5, py: 1 }}>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </section>
  )
}
