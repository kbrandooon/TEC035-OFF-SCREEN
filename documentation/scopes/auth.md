# Auth Feature Documentation

## Scope 1: Technical Documentation (Internal/Developer)

### 1. Overview
The Auth feature manages user authentication for the OFF SCREEN admin panel. It handles sign-in, sign-up, password recovery, and session state using Supabase Auth.

### 2. Architecture/Logic
We use Supabase Auth as the primary authentication provider. The state is managed via React Context (`AuthProvider`), which listens to Supabase session changes and propagates the current user state across the application. Hooks like `useLogin`, `useSignup`, and `useForgotPassword` encapsulate the business logic and API requests, keeping the UI components clean.

### 3. API/Function Reference
- `useLogin()`: Hook that provides `handleLogin` and `handleGoogleLogin` functions, managing email/password state and loading/error states.
- `useSignup()`: Hook that handles user registration logic.
- `useAuth()`: Hook to access the current authentication context (user session, loading state).
- `signIn(email, password)`: Core API wrapper for `supabase.auth.signInWithPassword`.
- `signInWithGoogle()`: Core API wrapper for OAuth login.

### 4. Edge Cases & Error Handling
- Invalid Credentials: The hooks catch Supabase errors and run them through `translateAuthError` to provide user-friendly messages.
- Stale Sessions: The `AuthProvider` sets up a listener (`onAuthStateChange`) to keep the app in sync if the user logs out from another tab.

### 5. Complexity
Time Complexity: $O(1)$ for local state updates. Network requests depend on Supabase response times.

---

## Scope 2: User Documentation (External/End-User)

### 1. Introduction
The authentication system allows you to securely log in to the OFF SCREEN admin dashboard. It supports email/password login as well as Google Single Sign-On (SSO).

### 2. Prerequisites
You must have a registered account or an authorized Google account connected to the system.

### 3. Step-by-Step Guide
**To log in with Email:**
1. Navigate to the main login page.
2. Enter your registered email address.
3. Enter your password.
4. Click "Iniciar Sesión".

**To log in with Google:**
1. On the login page, click "Acceder con Google".
2. Select your Google account in the popup.
3. You will be redirected to the dashboard automatically.

**To recover a password:**
1. Click "¿Olvidaste tu contraseña?" on the login screen.
2. Enter your email address and click submit.
3. Check your inbox for a password reset link.

### 4. FAQs/Troubleshooting
- **I didn't receive the reset email:** Check your spam folder or verify you typed the correct email.
- **Login fails with "Credenciales inválidas":** Double-check your password. If you forgot it, use the password recovery link.

### 5. Visual Aids
The login screen features a split layout: an image carousel on the left showcasing the studio, and the login form on the right. Form fields have clear active states to guide your input.
