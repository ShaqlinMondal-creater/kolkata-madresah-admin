import { useEffect, useMemo, useState } from 'react'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Menu from '@mui/material/Menu'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import CircularProgress from '@mui/material/CircularProgress'
import LinearProgress from '@mui/material/LinearProgress'
import TablePagination from '@mui/material/TablePagination'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import CloseIcon from '@mui/icons-material/Close'
import {
  getTransactionDetails,
  getTransactionsList,
} from '@/services/transactionsApi'

const defaultFilters = {
  search: '',
  date_from: '',
  date_to: '',
  mode: '',
  page: 1,
  perpage: 10,
}

const fieldSx = { bgcolor: '#fff' }
const smFieldSx = {
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
          return <span className="txn-filters__ph">{emptyLabel}</span>
        }
        const key = String(selected)
        return labels[key] ?? selected
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

function TxnRowMenu({ row, onAction }) {
  const [anchorEl, setAnchorEl] = useState(null)
  const open = Boolean(anchorEl)

  return (
    <>
      <IconButton
        size="small"
        aria-label={`Actions for transaction ${row.txn_id}`}
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
            onAction('details', row)
          }}
        >
          <ListItemIcon>
            <VisibilityOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Details</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchorEl(null)
            onAction('update', row)
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

export default function TransactionPage() {
  const [filters, setFilters] = useState(defaultFilters)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [rows, setRows] = useState([])
  const [meta, setMeta] = useState({ page: 1, pages: 1, perpage: 10, total: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState({ open: false, message: '' })
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState('')
  const [details, setDetails] = useState(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filters.search.trim()), 400)
    return () => clearTimeout(t)
  }, [filters.search])

  const queryKey = useMemo(
    () =>
      JSON.stringify({
        search: debouncedSearch,
        date_from: filters.date_from,
        date_to: filters.date_to,
        mode: filters.mode,
        page: filters.page,
        perpage: filters.perpage,
      }),
    [
      debouncedSearch,
      filters.date_from,
      filters.date_to,
      filters.mode,
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
        const res = await getTransactionsList(query)
        if (!alive) return
        if (Number(res.status) === 200 && res.data) {
          setRows(res.data.transactions || [])
          setMeta(res.data.meta || { page: 1, pages: 1, perpage: 10, total: 0 })
        } else {
          setRows([])
          setError(res.message || 'Could not load transactions.')
        }
      } catch {
        if (alive) {
          setRows([])
          setError(
            'Transactions API is unavailable. Please upload APIs/transactions/ and try again.',
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
    setDebouncedSearch('')
  }

  function showComingSoon(message) {
    setToast({ open: true, message })
  }

  async function openDetails(row) {
    setDetailsOpen(true)
    setDetails(null)
    setDetailsError('')
    setDetailsLoading(true)
    try {
      const res = await getTransactionDetails(row.txn_id)
      if (Number(res.status) === 200 && res.data?.transaction) {
        setDetails(res.data.transaction)
      } else {
        setDetailsError(res.message || 'Could not load transaction details.')
      }
    } catch {
      setDetailsError('Transaction details API is unavailable.')
    } finally {
      setDetailsLoading(false)
    }
  }

  function onRowAction(action, row) {
    if (action === 'details') {
      openDetails(row)
      return
    }
    showComingSoon(`Update for transaction #${row.txn_id} is coming soon.`)
  }

  const colSpan = 8

  return (
    <section className="module-page txn-page">
      <header className="txn-page__head">
        <div>
          <h1 className="text-gold-gradient">Transaction</h1>
        </div>
      </header>

      <div className="txn-filters">
        <div className="txn-filters__row">
          <TextField
            className="txn-filters__field--name"
            sx={fieldSx}
            value={filters.search}
            onChange={(e) => setField('search', e.target.value)}
            placeholder="Name or roll no"
            inputProps={{ 'aria-label': 'Name or roll no' }}
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

          <TextField
            select
            className="txn-filters__field--mode"
            sx={fieldSx}
            value={filters.mode}
            onChange={(e) => setField('mode', e.target.value)}
            slotProps={selectSlotProps('Mode', {
              pg: 'Online',
              cash: 'Cash',
              internal: 'Internal',
            })}
            inputProps={{ 'aria-label': 'Mode' }}
          >
            <MenuItem value="">
              <em>Mode</em>
            </MenuItem>
            <MenuItem value="pg">Online</MenuItem>
            <MenuItem value="cash">Cash</MenuItem>
            <MenuItem value="internal">Internal</MenuItem>
          </TextField>

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
                  width: 34,
                  height: 34,
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
              <th>Name</th>
              <th>Date</th>
              <th>From</th>
              <th>To</th>
              <th>Narration</th>
              <th>Mode</th>
              <th>Amount</th>
              <th className="txn-table__action">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="txn-table__empty">
                  <span className="txn-table__loading">
                    <CircularProgress size={22} thickness={4} />
                    Loading transactions…
                  </span>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="txn-table__empty">
                  No transactions found for these filters.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.txn_id}
                  className={loading ? 'is-loading' : undefined}
                >
                  <td>
                    <div className="txn-table__name">
                      <strong>{row.name || '—'}</strong>
                      <span>{row.roll_no || '—'}</span>
                    </div>
                  </td>
                  <td>{row.txn_date || '—'}</td>
                  <td>{row.type_from || '—'}</td>
                  <td>{row.type_to || '—'}</td>
                  <td>
                    <div className="txn-table__narration">
                      <strong>{row.narration || '—'}</strong>
                      {row.fpp_name ? <span>{row.fpp_name}</span> : null}
                    </div>
                  </td>
                  <td>
                    <span
                      className={`pill pill--mode-${row.txn_mode || 'other'}`}
                    >
                      {row.mode_label || '—'}
                    </span>
                  </td>
                  <td className="txn-table__amt">{formatInr(row.txn_amount)}</td>
                  <td className="txn-table__action">
                    <TxnRowMenu row={row} onAction={onRowAction} />
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
        maxWidth="sm"
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
          Transaction details
          {details?.txn_id ? ` #${details.txn_id}` : ''}
          <IconButton
            aria-label="Close"
            size="small"
            onClick={() => setDetailsOpen(false)}
            sx={{ position: 'absolute', right: 6, top: 6 }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent
          dividers
          sx={{ px: 1.5, py: 1.1 }}
        >
          {detailsLoading ? (
            <div className="txn-detail__loading">
              <CircularProgress size={26} />
              <span>Loading details…</span>
            </div>
          ) : detailsError ? (
            <p className="txn-detail__error">{detailsError}</p>
          ) : details ? (
            <div className="txn-detail">
              <section>
                <h3>Student</h3>
                <div className="txn-detail__grid">
                  <DetailRow label="Name" value={details.student?.name} />
                  <DetailRow label="Roll no" value={details.student?.roll_no} />
                  <DetailRow label="ITS" value={details.student?.its_id} />
                  <DetailRow label="Class" value={details.student?.class_name} />
                  <DetailRow
                    label="Mobile"
                    value={details.student?.mobile}
                    full
                  />
                </div>
              </section>

              {details.fee ? (
                <section>
                  <h3>Fee</h3>
                  <div className="txn-detail__grid txn-detail__grid--single">
                    <DetailRow label="Fee" value={details.fee.fpp_name} />
                    <DetailRow
                      label="Amount"
                      value={
                        details.fee.fpp_amount != null
                          ? formatInr(details.fee.fpp_amount)
                          : null
                      }
                    />
                    <DetailRow
                      label="Due date"
                      value={details.fee.fpp_due_date}
                    />
                    <DetailRow
                      label="Paid date"
                      value={details.fee.f_paid_date || '—'}
                    />
                  </div>
                </section>
              ) : null}

              <section>
                <h3>Transaction</h3>
                <div className="txn-detail__grid">
                  <DetailRow label="Date" value={details.txn_date} />
                  <DetailRow
                    label="Amount"
                    value={formatInr(details.txn_amount)}
                  />
                  <DetailRow label="Mode" value={details.mode_label} />
                  <DetailRow label="Type" value={details.type?.name} />
                  <DetailRow label="From" value={details.type?.from} />
                  <DetailRow label="To" value={details.type?.to} />
                  <DetailRow
                    label="Reason"
                    value={details.txn_reason}
                    full
                  />
                </div>
              </section>

              {details.detail ? (
                <section>
                  <h3>Payment detail</h3>
                  <div className="txn-detail__grid">
                    <DetailRow
                      label="Razorpay order"
                      value={details.detail.txndet_pg_razorpay_order_id}
                      full
                    />
                    <DetailRow
                      label="Razorpay payment"
                      value={details.detail.txndet_pg_razorpay_payment_id}
                      full
                    />
                    <DetailRow
                      label="ICICI id"
                      value={details.detail.txndet_pg_icici_id}
                    />
                    <DetailRow
                      label="PG credit date"
                      value={details.detail.txndet_pg_credit_date}
                    />
                    <DetailRow
                      label="Cash receipt"
                      value={details.detail.txndet_cash_receipt_no}
                    />
                    <DetailRow
                      label="Cash remarks"
                      value={details.detail.txndet_cash_remarks}
                      full
                    />
                    <DetailRow
                      label="Draft no"
                      value={details.detail.txndet_draft_no}
                    />
                    <DetailRow
                      label="Draft bank"
                      value={details.detail.txndet_draft_drawn_on_bank}
                    />
                    <DetailRow
                      label="Draft date"
                      value={details.detail.txndet_draft_date}
                    />
                    <DetailRow
                      label="NEFT ref"
                      value={details.detail.txndet_neft_ref_no}
                    />
                    <DetailRow
                      label="NEFT credit date"
                      value={details.detail.txndet_neft_credit_date}
                    />
                  </div>
                </section>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 1.5, py: 0.85 }}>
          <Button size="small" onClick={() => setDetailsOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

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
