/** Auto-mask DOB as DD-MM-YYYY while typing (digits only, clamps day/month/year). */
export function formatDobInput(value) {
  let digits = String(value ?? '').replace(/\D+/g, '').slice(0, 8)

  // Clamp day (positions 0-1)
  if (digits.length >= 1) {
    const d0 = Number(digits[0])
    if (d0 > 3) digits = '0' + d0 + digits.slice(2)
  }
  if (digits.length >= 2) {
    const day = Number(digits.slice(0, 2))
    if (day === 0) digits = '01' + digits.slice(2)
    else if (day > 31) digits = '31' + digits.slice(2)
  }

  // Clamp month (positions 2-3)
  if (digits.length >= 3) {
    const m0 = Number(digits[2])
    if (m0 > 1) digits = digits.slice(0, 2) + '0' + m0 + digits.slice(4)
  }
  if (digits.length >= 4) {
    const month = Number(digits.slice(2, 4))
    if (month === 0) digits = digits.slice(0, 2) + '01' + digits.slice(4)
    else if (month > 12) digits = digits.slice(0, 2) + '12' + digits.slice(4)
  }

  // Clamp year first digit (positions 4): only 1 or 2
  if (digits.length >= 5) {
    const y0 = Number(digits[4])
    if (y0 !== 1 && y0 !== 2) digits = digits.slice(0, 4) + '2' + digits.slice(5)
  }

  digits = digits.slice(0, 8)

  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}-${digits.slice(2)}`
  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`
}

/** True when value is a real calendar date in DD-MM-YYYY. */
export function isValidDob(str) {
  const m = String(str || '').match(/^(\d{2})-(\d{2})-(\d{4})$/)
  if (!m) return false
  const day = Number(m[1])
  const month = Number(m[2])
  const year = Number(m[3])
  if (month < 1 || month > 12) return false
  if (day < 1 || day > 31) return false
  if (year < 1920 || year > new Date().getFullYear()) return false
  const d = new Date(year, month - 1, day)
  return (
    d.getFullYear() === year &&
    d.getMonth() === month - 1 &&
    d.getDate() === day
  )
}
