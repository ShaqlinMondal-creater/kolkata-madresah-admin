import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { applyTheme } from '@/config/appConfig'
import '@/styles/global.css'
import '@/styles/app.css'
import App from '@/app/App.jsx'

applyTheme()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
