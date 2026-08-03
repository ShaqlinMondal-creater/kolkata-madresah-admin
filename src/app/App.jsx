import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import StudentsPage from '@/pages/admin/StudentsPage'
import FeesManagementPage from '@/pages/admin/FeesManagementPage'
import TransactionPage from '@/pages/admin/TransactionPage'
import AcademicSectionPage from '@/pages/admin/AcademicSectionPage'
import SettingsPage from '@/pages/admin/SettingsPage'
import ProfilePage from '@/pages/admin/ProfilePage'
import FeePaymentInstructions from '@/pages/FeePaymentInstructions'
import AboutUs from '@/pages/AboutUs'
import ContactUs from '@/pages/ContactUs'
import PrivacyPolicy from '@/pages/PrivacyPolicy'
import ProtectedRoute from '@/auth/ProtectedRoute'
import AdminLayout from '@/components/layout/AdminLayout'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />

        <Route
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/students" element={<StudentsPage />} />
          <Route path="/fees-management" element={<FeesManagementPage />} />
          <Route path="/transaction" element={<TransactionPage />} />
          <Route path="/academic-section" element={<AcademicSectionPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        <Route path="/fee-payment-instructions" element={<FeePaymentInstructions />} />
        <Route path="/about-us" element={<AboutUs />} />
        <Route path="/contact-us" element={<ContactUs />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      </Routes>
    </BrowserRouter>
  )
}
