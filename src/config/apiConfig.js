/**
 * API base URL for the PHP backend (APIs folder on admin host).
 * Override with VITE_API_BASE_URL in .env if needed.
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'https://admin.kolkatamadresah.com/APIs'

/** Admin panel userlevel — same string as old _admin/userlevel.php */
export const ADMIN_USERLEVEL = 'sadmin_df56fdg'
