// ── Public barrier for the `auth` feature ────────────────────────────────────
// Routes and other features MUST import from here, not from internal paths.

// Context
export { AuthProvider } from './context/auth-provider'

// Hooks
export { useAuth } from './hooks/use-auth'
export { useIsAdmin, useRoleLabel, useUserRole } from './hooks/use-user-role'
export type { TenantRole } from './hooks/use-user-role'

// API
export { signOut } from './api/sign-out'
export { signIn } from './api/sign-in'
export { signUpWithEmail } from './api/sign-up-with-email'
export { resetPasswordForEmail } from './api/reset-password-for-email'
export { verifyOtp } from './api/verify-otp'
export { checkEmailExists } from './api/check-email-exists'
export { signInWithGoogle } from './api/sign-in-with-google'
export { getSession } from './api/get-session'
export { onAuthStateChange } from './api/on-auth-state-change'
export { updateUser } from './api/update-user'

// Components
export { LoginPage } from './components/login-page'
export { SignupPage } from './components/signup-page'
export { ForgotPasswordPage } from './components/forgot-password-page'

// Types
export type { AuthContextType } from './context/auth-context'
