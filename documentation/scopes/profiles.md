# Profiles Feature Documentation

## Scope 1: Technical Documentation (Internal/Developer)

### 1. Overview
The Profiles feature manages the user profile data in the OFF SCREEN platform. It operates securely under a Multi-Tenant database schema, ensuring all user data is strongly isolated via PostgreSQL Row-Level Security (RLS).

### 2. Architecture/Logic
The structure follows a clean architecture model adapted for multi-tenancy. React Query is typically used in conjunction with a custom hook (`useProfile`) to fetch the authenticated user's profile from the Supabase `profiles` table. The profile contains a crucial `tenant_id` field that binds the user to their specific studio tenant.

### 3. API/Function Reference
- `getCurrentProfile()`: API function that fetches the current user's profile based on their authenticated session. Uses `select('*')` for simplicity since profiles are tightly constrained by RLS.
- `useProfile()`: React hook that calls `getCurrentProfile()` and tracks the profile state.
- `types/index.ts`: Contains the TypeScript interfaces for the profile object, including `tenant_id`.

### 4. Edge Cases & Error Handling
- Missing Profile: If the user is authenticated but the profile is missing, the system should gracefully degrade or prompt the user/admin, though typically profiles are created via trigger on signup.
- RLS Violations: If a user attempts to fetch profiles outside their tenant, Supabase RLS will simply return no rows, preventing data leakage.

### 5. Complexity
Time Complexity: $O(1)$ fetch for a single user by their primary key (UUID).

---

## Scope 2: User Documentation (External/End-User)

### 1. Introduction
Your profile contains your basic identifying information and links you to your specific studio environment within the system.

### 2. Prerequisites
You must be logged into your account to view or interact with your profile data.

### 3. Step-by-Step Guide
**To view your profile:**
1. Log in to the OFF SCREEN admin panel.
2. The system automatically loads your profile in the background to customize your experience and ensure you only see data related to your studio.

### 4. FAQs/Troubleshooting
- **Can I see other users' profiles?** No, the system uses strict security rules to ensure you can only access profiles within your own organization.
- **My information is incorrect:** Please contact a system administrator to update your profile details if they are inaccurate.

### 5. Visual Aids
Profile information may be displayed in the application header or in a dedicated "My Profile" settings page (if implemented).
