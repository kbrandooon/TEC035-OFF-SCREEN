## [Unreleased]

### ✨ Added
- Database Multitenant schema migrations (`tenants`, `profiles`, `roles` and RLS trigger injections).
- Backend Authentication API bindings (`signIn`, session fetch, etc.) adapting *Plato y Aparte* logic.
- Global `AuthProvider` for auth state persistence and distribution across TanStack Router.
- Backend Profile API and `useProfile` hook to retrieve user data using RLS isolation.
- New visually updated Login UI (`LoginPage`) per new "OFF SCREEN" specification.
- Tailwind css v4 customized variables for standard app palette.
- Google Fonts (`Manrope`) and Material Symbols Outlined support.

## 1.0.0 (2019-07-21)

### ✨ New Features
- UX/UI initial kit
- Supabase CLI functions
- Login session
- Sign In
- Sign Up
- Recovery Password pages
- OTP template
- Protected pages with authentication