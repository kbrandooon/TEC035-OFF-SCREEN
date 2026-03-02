## [Unreleased]

### ✨ Added

- Database Multitenant schema migrations (`tenants`, `profiles`, `roles` and RLS trigger injections).
- Backend Authentication API bindings (`signIn`, session fetch, etc.) adapting *Plato y Aparte* logic.
- Global `AuthProvider` for auth state persistence and distribution across TanStack Router.
- Backend Profile API and `useProfile` hook to retrieve user data using RLS isolation.
- New visually updated Login UI (`LoginPage`) per new "OFF SCREEN" specification.
- Tailwind css v4 customized variables for standard app palette.
- Google Fonts (`Manrope`) and Material Symbols Outlined support.
- **Equipo feature** (`/equipo`): full CRUD for equipment items with image upload, server-side pagination (15/page), and status + type + keyword filtering. Includes `EquipmentCard`, `EquipmentDetailView`, `EquipmentDetailModal`, and `EquipmentFormModal` components.
- **Inventario feature** (`/inventario`): movement log (Entrada / Salida / Ajuste) with server-side pagination (10/page) and date-range + movement-type filtering. Includes `InventoryList`, `InventoryCreateModal`, and `InventoryDetailModal`; row-click opens a detail overlay with inline edit and delete.
- `InventoryDetailModal`: backdrop-blur overlay with read view and toggle-to-edit form.
- `InventoryCreateModal`: backdrop-blur creation form matching the update modal style.
- Scope documentation for `equipo` and `inventario` in `/documentation/scopes/`.

### 🔧 Changed

- `ClientFormModal` refactored to use a keyed inner component instead of `setState` inside `useEffect`, eliminating the React lint warning and cascading-render risk.
- Dashboard `DashboardLayout` navigation migrated from `<a>` tags to TanStack Router `<Link>` components for SPA-style navigation — prevents full page reloads and state loss.
- Header in `DashboardLayout` is now section-aware: hides title/search in Equipo and Inventario sections; centers a functional name-search in the Clientes section.
- All route files now use a single merged import statement (inline `type` modifiers) to satisfy `no-duplicate-imports` ESLint rule.
- `useMemo` in `ClientesPage` moved above the early auth redirect return to satisfy React Rules of Hooks.


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