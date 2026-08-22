/**
 * Lookup city / state / country for a 6-digit Indian pincode.
 * Calls India Post API directly from the browser.
 * @returns {Promise<{ city: string, state: string, country: string, pincode: string }|null>}
 */
export async function lookupPincode(pincode) {
  const pin = String(pincode || '').replace(/\D+/g, '')
  if (pin.length !== 6) return null

  const response = await fetch(
    `https://api.postalpincode.in/pincode/${encodeURIComponent(pin)}`,
    {
      method: 'GET',
      headers: { Accept: 'application/json' },
    },
  )

  if (!response.ok) return null

  const decoded = await response.json()
  if (!Array.isArray(decoded) || !decoded[0]) return null

  const row = decoded[0]
  const status = String(row.Status || '')
  const offices = row.PostOffice

  if (status.toLowerCase() !== 'success' || !Array.isArray(offices) || offices.length === 0) {
    return null
  }

  const office = offices[0]
  let city = String(office.District || '').trim()
  if (!city) city = String(office.Name || '').trim()
  const state = String(office.State || '').trim()
  let country = String(office.Country || '').trim()
  if (!country) country = 'India'

  return {
    pincode: pin,
    city,
    state,
    country,
  }
}
