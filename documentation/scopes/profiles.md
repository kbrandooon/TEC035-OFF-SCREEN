# Profiles Feature Documentation

## Overview
This feature manages the user profile data in the **OFF SCREEN** platform. It operates securely under the new Multi-Tenant database schema, ensuring all user data is strongly isolated via PostgreSQL Row-Level Security (RLS).

## Core Logic
The structure follows the architecture implemented in `TEC015-Plato-y-Aparte` but adapted for multi-tenancy.
- **`types/`**: Contains the interface definitions mirroring the Supabase `profiles` table which includes the crucial `tenant_id` field.
- **`api/profiles-api.ts`**: Encapsulates all interactions with the `profiles` table, strictly querying the current authenticated user's profile.
- **`hooks/use-profile.ts`**: Provides an efficient React hook to fetch and keep track of the current user's profile information by binding with the global `useAuth()` session.

## Data Fetching
No wildcard selects `select(*)` are encouraged for large operations, though for the single `getCurrentProfile` call, it uses `select('*')` for simplicity since profiles are tightly constrained by RLS. Future multi-record fetches must specify columns explicitly.

## RLS & Multi-Tenancy Strategy
Profiles are restricted by:
- RLS Policy: `Tenant isolation for profiles - SELECT` which matches the profile's `tenant_id` with the decoded `auth.jwt() ->> 'tenant_id'`.
- This ensures any request made by a logged-in user to grab profiles will inherently exclude other Studio profiles.
