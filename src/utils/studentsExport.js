import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { getStudentsList } from '@/services/studentsApi'

const EXPORT_COLUMNS = [
  { key: 'sn', label: 'SN' },
  { key: 'name', label: 'Name' },
  { key: 'roll_no', label: 'Roll no' },
  { key: 'its_id', label: 'ITS' },
  { key: 'ay_name', label: 'Year' },
  { key: 'class_name', label: 'Class' },
  { key: 'gender', label: 'Gender' },
  { key: 'dob', label: 'DOB' },
  { key: 'status', label: 'Status' },
  { key: 'mobile', label: 'Mobile' },
]

function cell(value) {
  if (value === null || value === undefined || value === '') return '—'
  return String(value)
}

export function mapStudentExportRow(st, index = 0) {
  return {
    sn: st.sn ?? index + 1,
    name: cell(st.name),
    roll_no: cell(st.roll_no),
    its_id: cell(st.its_id),
    ay_name: cell(st.ay_name),
    class_name: cell(st.class_name),
    gender: cell(st.gender),
    dob: cell(st.dob),
    status: st.on_roll ? 'On-roll' : 'Off-roll',
    mobile: cell(st.mobile),
  }
}

function stamp() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`
}

/** Fetch every student matching filters (pages through list API, max 100/page). */
export async function fetchStudentsForExport(filters = {}) {
  const base = {
    ...filters,
    search:
      typeof filters.search === 'string' ? filters.search.trim() : filters.search,
    page: 1,
    perpage: 100,
  }

  const first = await getStudentsList(base)
  if (Number(first.status) !== 200 || !first.data) {
    throw new Error(first.message || 'Could not load students for export.')
  }

  const total = Number(first.data.meta?.total || 0)
  const pages = Math.max(1, Number(first.data.meta?.pages || 1))
  let all = [...(first.data.students || [])]

  for (let page = 2; page <= pages; page += 1) {
    const res = await getStudentsList({ ...base, page })
    if (Number(res.status) !== 200 || !res.data) {
      throw new Error(res.message || `Could not load export page ${page}.`)
    }
    all = all.concat(res.data.students || [])
  }

  if (total > 0 && all.length === 0) {
    throw new Error('No students found for these filters.')
  }

  return all
}

function excelColWidth(header, values) {
  let max = String(header || '').length
  values.forEach((v) => {
    const len = String(v ?? '').length
    if (len > max) max = len
  })
  // Excel width units ≈ character count; pad a little so nothing clips
  return Math.min(60, Math.max(10, max + 2))
}

export function downloadStudentsExcel(students, filenamePrefix = 'students') {
  const rows = students.map((st, i) => mapStudentExportRow(st, i))
  const headers = EXPORT_COLUMNS.map((col) => col.label)
  const aoa = [
    headers,
    ...rows.map((row) => EXPORT_COLUMNS.map((col) => String(row[col.key] ?? ''))),
  ]

  const worksheet = XLSX.utils.aoa_to_sheet(aoa)

  // Keep IDs / dates / phones as plain text (no scientific notation / clipping)
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
  for (let r = range.s.r; r <= range.e.r; r += 1) {
    for (let c = range.s.c; c <= range.e.c; c += 1) {
      const addr = XLSX.utils.encode_cell({ r, c })
      const cell = worksheet[addr]
      if (!cell) continue
      cell.t = 's'
      cell.v = String(cell.v ?? '')
      delete cell.w
      delete cell.z
    }
  }

  worksheet['!cols'] = EXPORT_COLUMNS.map((col) => ({
    wch: excelColWidth(
      col.label,
      rows.map((row) => row[col.key]),
    ),
  }))

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Students')
  XLSX.writeFile(workbook, `${filenamePrefix}_${stamp()}.xlsx`)
}

export function downloadStudentsPdf(students, filenamePrefix = 'students') {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  const title = 'Students export'
  doc.setFontSize(14)
  doc.text(title, 40, 36)
  doc.setFontSize(9)
  doc.setTextColor(100)
  doc.text(`Generated ${new Date().toLocaleString()} · ${students.length} row(s)`, 40, 52)
  doc.setTextColor(0)

  const body = students.map((st, i) => {
    const row = mapStudentExportRow(st, i)
    return EXPORT_COLUMNS.map((col) => row[col.key])
  })

  autoTable(doc, {
    startY: 64,
    head: [EXPORT_COLUMNS.map((col) => col.label)],
    body,
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [15, 118, 110], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { left: 40, right: 40 },
  })

  doc.save(`${filenamePrefix}_${stamp()}.pdf`)
}
