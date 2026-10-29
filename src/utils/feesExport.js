import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { getFeesList } from '@/services/feesApi'

const EXPORT_COLUMNS = [
  { key: 'sn', label: 'SN' },
  { key: 'name', label: 'Name' },
  { key: 'roll_no', label: 'Roll no' },
  { key: 'its_id', label: 'ITS' },
  { key: 'class_name', label: 'Class' },
  { key: 'fpp_name', label: 'Fee' },
  { key: 'fpp_due_date', label: 'Due date' },
  { key: 'f_paid_date', label: 'Paid date' },
  { key: 'fee_amount_net', label: 'Amount' },
  { key: 'late_fee_applicable', label: 'Late fee' },
  { key: 'total_amount', label: 'Total' },
  { key: 'status_label', label: 'Status' },
]

function cell(value) {
  if (value === null || value === undefined || value === '') return '—'
  return String(value)
}

function formatInr(amount) {
  return Number(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

export function mapFeeExportRow(fee, index = 0) {
  return {
    sn: fee.sn ?? index + 1,
    name: cell(fee.name),
    roll_no: cell(fee.roll_no),
    its_id: cell(fee.its_id),
    class_name: cell(fee.class_name),
    fpp_name: cell(fee.fpp_name),
    fpp_due_date: cell(fee.fpp_due_date),
    f_paid_date: cell(fee.f_paid_date),
    fee_amount_net: formatInr(fee.fee_amount_net),
    late_fee_applicable: formatInr(fee.late_fee_applicable),
    total_amount: formatInr(fee.total_amount),
    status_label: cell(fee.status_label || (fee.status === 'paid' ? 'Paid' : 'Pending')),
  }
}

function stamp() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`
}

/** Fetch every fee row matching filters (pages through list API, max 100/page). */
export async function fetchFeesForExport(filters = {}) {
  const base = {
    ...filters,
    search:
      typeof filters.search === 'string' ? filters.search.trim() : filters.search,
    page: 1,
    perpage: 100,
  }

  const first = await getFeesList(base)
  if (Number(first.status) !== 200 || !first.data) {
    throw new Error(first.message || 'Could not load fees for export.')
  }

  const total = Number(first.data.meta?.total || 0)
  const pages = Math.max(1, Number(first.data.meta?.pages || 1))
  let all = [...(first.data.fees || [])]

  for (let page = 2; page <= pages; page += 1) {
    const res = await getFeesList({ ...base, page })
    if (Number(res.status) !== 200 || !res.data) {
      throw new Error(res.message || `Could not load export page ${page}.`)
    }
    all = all.concat(res.data.fees || [])
  }

  if (total > 0 && all.length === 0) {
    throw new Error('No fee payments found for these filters.')
  }

  return all
}

function excelColWidth(header, values) {
  let max = String(header || '').length
  values.forEach((v) => {
    const len = String(v ?? '').length
    if (len > max) max = len
  })
  return Math.min(60, Math.max(10, max + 2))
}

export function downloadFeesExcel(fees, filenamePrefix = 'fees') {
  const rows = fees.map((fee, i) => mapFeeExportRow(fee, i))
  const headers = EXPORT_COLUMNS.map((col) => col.label)
  const aoa = [
    headers,
    ...rows.map((row) => EXPORT_COLUMNS.map((col) => String(row[col.key] ?? ''))),
  ]

  const worksheet = XLSX.utils.aoa_to_sheet(aoa)

  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
  for (let r = range.s.r; r <= range.e.r; r += 1) {
    for (let c = range.s.c; c <= range.e.c; c += 1) {
      const addr = XLSX.utils.encode_cell({ r, c })
      const cellRef = worksheet[addr]
      if (!cellRef) continue
      cellRef.t = 's'
      cellRef.v = String(cellRef.v ?? '')
      delete cellRef.w
      delete cellRef.z
    }
  }

  worksheet['!cols'] = EXPORT_COLUMNS.map((col) => ({
    wch: excelColWidth(
      col.label,
      rows.map((row) => row[col.key]),
    ),
  }))

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Fees')
  XLSX.writeFile(workbook, `${filenamePrefix}_${stamp()}.xlsx`)
}

export function downloadFeesPdf(fees, filenamePrefix = 'fees') {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  doc.setFontSize(14)
  doc.text('Fees export', 40, 36)
  doc.setFontSize(9)
  doc.setTextColor(100)
  doc.text(`Generated ${new Date().toLocaleString()} · ${fees.length} row(s)`, 40, 52)
  doc.setTextColor(0)

  const body = fees.map((fee, i) => {
    const row = mapFeeExportRow(fee, i)
    return EXPORT_COLUMNS.map((col) => row[col.key])
  })

  autoTable(doc, {
    startY: 64,
    head: [EXPORT_COLUMNS.map((col) => col.label)],
    body,
    styles: { fontSize: 7.5, cellPadding: 3.5 },
    headStyles: { fillColor: [15, 118, 110], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { left: 40, right: 40 },
  })

  doc.save(`${filenamePrefix}_${stamp()}.pdf`)
}
