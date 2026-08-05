import {
  IconDashboard,
  IconFees,
  IconTransaction,
} from '@/components/icons/AdminIcons'

export const studentNavItems = [
  { to: '/student', label: 'Dashboard', icon: IconDashboard, end: true },
  { to: '/student/pending-fees', label: 'Pending Fees', icon: IconFees },
  { to: '/student/paid-fees', label: 'Paid Fees', icon: IconFees },
  { to: '/student/transactions', label: 'Transactions', icon: IconTransaction },
]
