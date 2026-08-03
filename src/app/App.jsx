import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LoginPage from '@/pages/LoginPage'
import FeePaymentInstructions from '@/pages/FeePaymentInstructions'
import AboutUs from '@/pages/AboutUs'
import ContactUs from '@/pages/ContactUs'
import PrivacyPolicy from '@/pages/PrivacyPolicy'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/fee-payment-instructions" element={<FeePaymentInstructions />} />
        <Route path="/about-us" element={<AboutUs />} />
        <Route path="/contact-us" element={<ContactUs />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      </Routes>
    </BrowserRouter>
  )
}
