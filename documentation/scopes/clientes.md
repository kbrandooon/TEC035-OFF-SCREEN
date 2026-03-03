# Scope: Clientes (Customer Management)

## Overview

The **Clientes** feature manages the client registry for Off Screen. Clients are linked to reservations via `customer_id` and displayed by name throughout the booking workflow. The module provides CRUD operations with tenant-scoped isolation.

---

## Frontend

### Location

`src/features/clientes/`

### Key Components

| Component | Purpose |
|---|---|
| `ClientList` | Table of all clients with edit/delete actions per row |
| `ClientFormModal` | Backdrop-blur overlay for create and edit operations |

### Hook: `useClients`

Manages the full client list. Exposes `clients`, `isLoading`, `error`, `onCreate`, `onUpdate`, `onDelete`, and `refetch`. No pagination — the dataset is expected to be small enough for a single query.

### State Management

All state is local to `useClients`. No global store is used.

---

## Backend (Supabase)

### Table: `customers`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` (PK) | Auto-generated |
| `tenant_id` | `uuid` (FK → tenants) | RLS isolation |
| `names` | `text` | First name(s) |
| `last_name` | `text` | Last name(s) |
| `email` | `text?` | Optional contact email |
| `phone` | `text?` | Optional contact phone |
| `created_at` / `created_by` | `timestamptz` / `uuid` | Audit fields |
| `updated_at` / `updated_by` | `timestamptz` / `uuid` | Audit fields |

### RLS

Row-level security enforces `tenant_id = auth.jwt() ->> 'tenant_id'` on all operations.

> **Note:** The `customers` table is also referenced by the `v_reservations` view to denormalize `customer_names` and `customer_last_name` for the Reservas feature. Any schema change to these columns must account for that view.

---

## API Layer (`src/features/clientes/api/`)

One function per file per Screaming Architecture standards:

| File | Operation |
|---|---|
| `get-clients.ts` | Fetches all clients ordered by `names` |
| `create-client.ts` | `INSERT` new customer; returns full record |
| `update-client.ts` | `UPDATE` editable fields by ID |
| `delete-client.ts` | `DELETE` customer by ID |

All queries list columns explicitly — no wildcard `select('*')`.
