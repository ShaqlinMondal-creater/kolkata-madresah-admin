import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import StudentsPage from '@/pages/admin/StudentsPage'
import AddStudentPage from '@/pages/admin/AddStudentPage'
import StudentDetailsPage from '@/pages/admin/StudentDetailsPage'
import FeesManagementPage from '@/pages/admin/FeesManagementPage'
import TransactionPage from '@/pages/admin/TransactionPage'
import AcademicSectionPage from '@/pages/admin/AcademicSectionPage'
import SettingsPage from '@/pages/admin/SettingsPage'
import ProfilePage from '@/pages/admin/ProfilePage'
import StudentDashboardPage from '@/pages/student/StudentDashboardPage'
import StudentFeesPage from '@/pages/student/StudentFeesPage'
import StudentTransactionsPage from '@/pages/student/StudentTransactionsPage'
import FeePaymentInstructions from '@/pages/FeePaymentInstructions'
import AboutUs from '@/pages/AboutUs'
import ContactUs from '@/pages/ContactUs'
import PrivacyPolicy from '@/pages/PrivacyPolicy'
import ProtectedRoute from '@/auth/ProtectedRoute'
import StudentProtectedRoute from '@/auth/StudentProtectedRoute'
import AdminLayout from '@/components/layout/AdminLayout'
import StudentLayout from '@/components/layout/StudentLayout'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />

        <Route
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/students" element={<StudentsPage />} />
          <Route path="/students/new" element={<AddStudentPage />} />
          <Route path="/students/:stId" element={<StudentDetailsPage />} />
          <Route path="/fees-management" element={<FeesManagementPage />} />
          <Route path="/transaction" element={<TransactionPage />} />
          <Route path="/academic-section" element={<AcademicSectionPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        <Route
          path="/student"
          element={
            <StudentProtectedRoute>
              <StudentLayout />
            </StudentProtectedRoute>
          }
        >
          <Route index element={<StudentDashboardPage />} />
          <Route
            path="pending-fees"
            element={<StudentFeesPage status="pending" />}
          />
          <Route
            path="paid-fees"
            element={<StudentFeesPage status="paid" />}
          />
          <Route path="transactions" element={<StudentTransactionsPage />} />
        </Route>

        <Route path="/fee-payment-instructions" element={<FeePaymentInstructions />} />
        <Route path="/about-us" element={<AboutUs />} />
        <Route path="/contact-us" element={<ContactUs />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
