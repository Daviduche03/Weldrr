import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/modules/auth/auth-provider'
import { AppRouter } from '@/app/router'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="light">
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
