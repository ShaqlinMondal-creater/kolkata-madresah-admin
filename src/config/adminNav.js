import {
  IconAcademic,
  IconActionLogs,
  IconDashboard,
  IconFees,
  IconSettings,
  IconStudents,
  IconTransaction,
} from '@/components/icons/AdminIcons'

export const adminNavItems = [
  { to: '/dashboard', label: 'Dashboard', icon: IconDashboard },
  { to: '/students', label: 'Students', icon: IconStudents },
  { to: '/fees-management', label: 'Fees Management', icon: IconFees },
  { to: '/transaction', label: 'Transaction', icon: IconTransaction },
  { to: '/academic-section', label: 'Academic Section', icon: IconAcademic },
  { to: '/settings', label: 'Settings', icon: IconSettings },
  { to: '/action-logs', label: 'Action Logs', icon: IconActionLogs },
]
