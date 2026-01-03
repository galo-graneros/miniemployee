import { Routes, Route } from 'react-router-dom'
import { Toaster } from './components/ui/toaster'
import { ProtectedRoute } from './components/auth/protected-route'

// Pages
import HomePage from './pages/home'
import LoginPage from './pages/login'
import SignupPage from './pages/signup'
import ForgotPasswordPage from './pages/forgot-password'
import ResetPasswordPage from './pages/reset-password'
import SettingsPage from './pages/settings'
import HistoryPage from './pages/history'
import VaultPage from './pages/vault'
import PrivacyPage from './pages/privacy'
import TermsPage from './pages/terms'
import AuthCallback from './pages/auth-callback'
import LandingPage from './pages/landing'

function App() {
  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Protected routes */}
        <Route path="/settings" element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        } />
        <Route path="/history" element={
          <ProtectedRoute>
            <HistoryPage />
          </ProtectedRoute>
        } />
        <Route path="/vault" element={
          <ProtectedRoute>
            <VaultPage />
          </ProtectedRoute>
        } />
      </Routes>
      <Toaster />
    </>
  )
}

export default App
