import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css';
import App from './App.jsx'

// Get theme from localStorage or default to light
const theme = localStorage.getItem('theme') || 'light'
document.documentElement.setAttribute('data-bs-theme', theme)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
