import './globals.css';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './main-window.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

