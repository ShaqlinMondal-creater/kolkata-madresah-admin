import { useEffect, useMemo, useState } from 'react'
import CircularProgress from '@mui/material/CircularProgress'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import LinearProgress from '@mui/material/LinearProgress'
import MenuItem from '@mui/material/MenuItem'
import TablePagination from '@mui/material/TablePagination'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import CloseIcon from '@mui/icons-material/Close'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import {
  getStudentTransactionDetails,
  getStudentTransactions,
} from '@/services/studentPanelApi'

function formatInr(amount) {
  return Number(amount || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  })
}

function DetailRow({ label, value, full = false }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div className={`st-txn-detail__row${full ? ' is-full' : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

const fieldSx = {
  minWidth: 150,
  bgcolor: '#fff',
  '& .MuiOutlinedInput-root': {
    borderRadius: '0.65rem',
    height: 40,
  },
}

const dateSx = {
  minWidth: 168,
  bgcolor: '#fff',
  '& .MuiOutlinedInput-root': {
    borderRadius: '0.65rem',
    height: 40,
  },
  '& input': {
    fontSize: '0.88rem',
    py: 0,
  },
}

const defaultFilters = {
  mode: '',
  date_from: '',
  date_to: '',
  page: 1,
  perpage: 20,
}

function modeSlotProps() {
  return {
    select: {
      displayEmpty: true,
      renderValue: (selected) => {
        if (!selected) {
          return <span className="st-txn-filters__ph">Mode</span>
        }
        const map = { pg: 'Online', cash: 'Cash', internal: 'Internal' }
        return map[selected] ?? selected
      },
    },
  }
}

export default function StudentTransactionsPage() {
  const [filters, setFilters] = useState(defaultFilters)
  const [rows, setRows] = useState([])
  const [meta, setMeta] = useState({
    page: 1,
    pages: 1,
    perpage: 20,
    total: 0,
  })
  const [balances, setBalances] = useState({ deposit: 0, wallet: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState('')
  const [details, setDetails] = useState(null)

  const queryKey = useMemo(
    () =>
      JSON.stringify({
        mode: filters.mode,
        date_from: filters.date_from,
        date_to: filters.date_to,
        page: filters.page,
        perpage: filters.perpage,
      }),
    [
      filters.mode,
      filters.date_from,
      filters.date_to,
      filters.page,
      filters.perpage,
    ],
  )

  useEffect(() => {
    const query = JSON.parse(queryKey)
    let alive = true

    async function load() {
      setLoading(true)
      setError('')
      try {
        const res = await getStudentTransactions(query)
        if (!alive) return
        if (Number(res.status) === 200 && res.data) {
          setRows(res.data.transactions || [])
          setMeta(
            res.data.meta || {
              page: 1,
              pages: 1,
              perpage: 20,
              total: 0,
            },
          )
          setBalances({
            deposit: res.data.deposit ?? 0,
            wallet: res.data.wallet ?? 0,
          })
        } else {
          setRows([])
          setError(res.message || 'Could not load transactions.')
        }
      } catch {
        if (alive) {
          setRows([])
          setError(
            'Transactions API unavailable. Upload APIs/student-panel/transactions.php',
          )
        }
      } finally {
        if (alive) setLoading(false)
      }
    }

    load()
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
  }

  async function openDetails(row) {
    setDrawerOpen(true)
    setDetails(null)
    setDetailsError('')
    setDetailsLoading(true)
    try {
      const res = await getStudentTransactionDetails(row.txn_id)
      if (Number(res.status) === 200 && res.data?.transaction) {
        setDetails(res.data.transaction)
      } else {
        setDetailsError(res.message || 'Could not load transaction details.')
      }
    } catch {
      setDetailsError(
        'Details API unavailable. Upload APIs/student-panel/transaction_details.php',
      )
    } finally {
      setDetailsLoading(false)
    }
  }

  const det = details?.detail

  return (
    <section className="module-page student-page st-txn-page">
      <header className="student-page__head student-page__head--row">
        <div>
          <h1 className="text-gold-gradient">Transactions</h1>
          <p>
            {meta.total || 0} record(s)
            {loading ? '' : ` · Deposit ₹${formatInr(balances.deposit)} · Wallet ₹${formatInr(balances.wallet)}`}
          </p>
        </div>
      </header>

      <div className="st-txn-filters">
        <TextField
          select
          size="small"
          sx={fieldSx}
          value={filters.mode}
          onChange={(e) => setField('mode', e.target.value)}
          slotProps={modeSlotProps()}
          inputProps={{ 'aria-label': 'Mode' }}
        >
          <MenuItem value="">
            <em>All modes</em>
          </MenuItem>
          <MenuItem value="pg">Online</MenuItem>
          <MenuItem value="cash">Cash</MenuItem>
          <MenuItem value="internal">Internal</MenuItem>
        </TextField>

        <TextField
          size="small"
          type="date"
          sx={dateSx}
          value={filters.date_from}
          onChange={(e) => setField('date_from', e.target.value)}
          inputProps={{ 'aria-label': 'Date from', title: 'From date' }}
        />

        <TextField
          size="small"
          type="date"
          sx={dateSx}
          value={filters.date_to}
          onChange={(e) => setField('date_to', e.target.value)}
          inputProps={{ 'aria-label': 'Date to', title: 'To date' }}
        />

        <Tooltip title="Reset filters">
          <IconButton
            aria-label="Reset filters"
            onClick={resetFilters}
            color="primary"
            size="small"
            className="st-txn-filters__reset"
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

      {error ? <p className="student-page__error">{error}</p> : null}

      <div className="student-fees-wrap st-txn-table-wrap">
        {loading ? <LinearProgress className="st-txn-table__progress" /> : null}
        <table className="student-fees-table st-txn-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Narration</th>
              <th>From → To</th>
              <th>Mode</th>
              <th>Amount</th>
              <th className="st-txn-table__action">Details</th>
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="st-txn-table__empty">
                  <span className="student-page__loading">
                    <CircularProgress size={20} />
                    Loading transactions…
                  </span>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="st-txn-table__empty">
                  No transactions found.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.txn_id}>
                  <td>{row.txn_date || '—'}</td>
                  <td>
                    <div className="st-txn-table__narration">
                      <strong>{row.narration || '—'}</strong>
                      {row.fpp_name ? <span>{row.fpp_name}</span> : null}
                    </div>
                  </td>
                  <td>
                    {row.type_from || '—'} → {row.type_to || '—'}
                  </td>
                  <td>
                    <span
                      className={`st-txn-pill st-txn-pill--${row.txn_mode || 'other'}`}
                    >
                      {row.mode_label || '—'}
                    </span>
                  </td>
                  <td>
                    <strong>₹{formatInr(row.txn_amount)}</strong>
                  </td>
                  <td className="st-txn-table__action">
                    <IconButton
                      size="small"
                      aria-label={`View transaction ${row.txn_id}`}
                      onClick={() => openDetails(row)}
                      className="st-txn-table__view"
                    >
                      <VisibilityOutlinedIcon fontSize="small" />
                    </IconButton>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <TablePagination
        component="div"
        className="st-txn-pager"
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
        rowsPerPageOptions={[10, 20, 50]}
        labelRowsPerPage="Rows:"
      />

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ className: 'st-txn-drawer' }}
      >
        <header className="st-txn-drawer__head">
          <div>
            <h2>Transaction details</h2>
            {details?.txn_id ? <p>#{details.txn_id}</p> : null}
          </div>
          <IconButton
            aria-label="Close"
            onClick={() => setDrawerOpen(false)}
            size="small"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </header>

        <div className="st-txn-drawer__body">
          {detailsLoading ? (
            <div className="student-page__loading">
              <CircularProgress size={24} />
              Loading details…
            </div>
          ) : detailsError ? (
            <p className="student-page__error">{detailsError}</p>
          ) : details ? (
            <div className="st-txn-detail">
              <section>
                <h3>Transaction</h3>
                <div className="st-txn-detail__grid">
                  <DetailRow label="Date" value={details.txn_date} />
                  <DetailRow
                    label="Amount"
                    value={`₹${formatInr(details.txn_amount)}`}
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

              {details.fee ? (
                <section>
                  <h3>Fee</h3>
                  <div className="st-txn-detail__grid">
                    <DetailRow
                      label="Fee"
                      value={details.fee.fpp_name}
                      full
                    />
                    <DetailRow
                      label="Amount"
                      value={
                        details.fee.fpp_amount != null
                          ? `₹${formatInr(details.fee.fpp_amount)}`
                          : null
                      }
                    />
                    <DetailRow
                      label="Due date"
                      value={details.fee.fpp_due_date}
                    />
                    <DetailRow
                      label="Paid date"
                      value={details.fee.f_paid_date}
                    />
                  </div>
                </section>
              ) : null}

              {det ? (
                <section>
                  <h3>Payment detail</h3>
                  <div className="st-txn-detail__grid">
                    <DetailRow
                      label="Razorpay order"
                      value={det.razorpay_order_id}
                      full
                    />
                    <DetailRow
                      label="Razorpay payment"
                      value={det.razorpay_payment_id}
                      full
                    />
                    <DetailRow label="ICICI id" value={det.icici_id} />
                    <DetailRow
                      label="PG credit date"
                      value={det.pg_credit_date}
                    />
                    <DetailRow
                      label="Cash receipt"
                      value={det.cash_receipt_no}
                    />
                    <DetailRow
                      label="Cash remarks"
                      value={det.cash_remarks}
                      full
                    />
                    <DetailRow label="Draft no" value={det.draft_no} />
                    <DetailRow label="Draft bank" value={det.draft_bank} />
                    <DetailRow label="Draft date" value={det.draft_date} />
                    <DetailRow label="NEFT ref" value={det.neft_ref_no} />
                    <DetailRow
                      label="NEFT credit date"
                      value={det.neft_credit_date}
                    />
                  </div>
                </section>
              ) : null}
            </div>
          ) : null}
        </div>
      </Drawer>
    </section>
  )
}
