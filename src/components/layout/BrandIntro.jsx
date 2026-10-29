import { useEffect, useRef } from 'react'
import { site } from '@/config/appConfig'

const BRAND = site.name || 'KolkataMadresah.com'
const SOCIETY = site.society || 'The Madresah Tayebiyah Society'

/** Soft animation floor — never block long after app is ready */
const MIN_MS = 650
const FADE_MS = 260
const MAX_MS = 1800

function whenAppReady() {
  const fontsReady =
    document.fonts?.ready?.catch?.(() => undefined) ?? Promise.resolve()
  const paintReady = new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve))
  })
  return Promise.all([fontsReady, paintReady])
}

/**
 * Soft branded intro — stays until the app is ready (pro loader logic),
 * with a short minimum so typing/smoke still look soft.
 */
export default function BrandIntro({ onDone }) {
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone
  const doneOnce = useRef(false)

  useEffect(() => {
    let alive = true
    const started = performance.now()

    function finish() {
      if (!alive || doneOnce.current) return
      doneOnce.current = true
      document.getElementById('brand-intro-root')?.classList.add('is-leaving')
      window.setTimeout(() => {
        if (alive) onDoneRef.current?.()
      }, FADE_MS)
    }

    const safety = window.setTimeout(finish, MAX_MS)

    whenAppReady().then(() => {
      if (!alive) return
      const elapsed = performance.now() - started
      const wait = Math.max(0, MIN_MS - elapsed)
      window.setTimeout(finish, wait)
    })

    return () => {
      alive = false
      window.clearTimeout(safety)
    }
  }, [])

  return (
    <div
      id="brand-intro-root"
      className="brand-intro"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="brand-intro__glow" aria-hidden="true" />
      <div className="brand-intro__panel">
        <p className="brand-intro__brand">
          <span className="brand-intro__type">
            <span className="brand-intro__brand-text">{BRAND}</span>
          </span>
          <span className="brand-intro__caret" aria-hidden="true" />
        </p>
        <p className="brand-intro__society">{SOCIETY}</p>
      </div>
    </div>
  )
}
