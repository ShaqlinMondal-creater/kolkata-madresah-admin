import { useEffect, useRef, useState } from 'react'
import { lookupPincode } from '@/services/pincodeApi'

/**
 * When pincode reaches 6 digits, fetch city/state/country and call onResolved.
 */
export function usePincodeLookup(pincode, onResolved) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const lastPin = useRef('')
  const onResolvedRef = useRef(onResolved)

  useEffect(() => {
    onResolvedRef.current = onResolved
  }, [onResolved])

  useEffect(() => {
    const pin = String(pincode || '').replace(/\D+/g, '')
    if (pin.length !== 6) {
      setLoading(false)
      setError('')
      lastPin.current = ''
      return undefined
    }

    if (pin === lastPin.current) return undefined
    lastPin.current = pin

    let alive = true
    const timer = setTimeout(async () => {
      setLoading(true)
      setError('')
      try {
        const result = await lookupPincode(pin)
        if (!alive) return
        if (!result) {
          setError('No address found for this pincode')
          return
        }
        onResolvedRef.current?.(result)
      } catch {
        if (alive) setError('Pincode lookup failed')
      } finally {
        if (alive) setLoading(false)
      }
    }, 350)

    return () => {
      alive = false
      clearTimeout(timer)
    }
  }, [pincode])

  return { loading, error }
}
