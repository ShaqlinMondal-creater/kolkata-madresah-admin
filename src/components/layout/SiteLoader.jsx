import { useCallback, useState } from 'react'
import BrandIntro from '@/components/layout/BrandIntro'

function removeBootShell() {
  const boot = document.getElementById('site-boot-loader')
  if (!boot) return
  boot.classList.add('is-done')
  window.setTimeout(() => boot.remove(), 120)
}

/**
 * Professional boot loader:
 * - shows only on real first app load / hard refresh
 * - hides when the app is ready (not a fake full-page timer)
 * - does not replay on normal route changes (login ↔ dashboard, etc.)
 * Page/API waits still use each page’s own progress spinner.
 */
export default function SiteLoader() {
  const [open, setOpen] = useState(true)

  const handleDone = useCallback(() => {
    removeBootShell()
    setOpen(false)
  }, [])

  if (!open) return null

  return <BrandIntro onDone={handleDone} />
}
