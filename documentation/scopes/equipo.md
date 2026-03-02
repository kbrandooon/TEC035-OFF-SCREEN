# Scope: Equipo (Equipment Management)

## Overview

The **Equipo** feature manages the physical inventory of audiovisual equipment owned by Off Screen. It provides CRUD operations for individual equipment items and enforces tenant isolation via Supabase RLS.

---

## Frontend

### Location

`src/features/equipo/`

### Key Components

| Component | Purpose |
|---|---|
| `EquipmentList` | Renders a grid of equipment cards with status indicators |
| `EquipmentCard` | Single card showing name, type, status badge, and an image |
| `EquipmentDetailView` | Full-page view of a single item with edit/delete actions |
| `EquipmentDetailModal` | Backdrop-blur overlay for quick detail view on list page |
| `EquipmentFormModal` | Create/Edit form modal with image upload support |

### Hook: `useEquipment`

Manages a paginated, filtered equipment list. Accepts `page`, `search`, `status`, and `type` params. Re-fetches automatically when any param changes. Exposes `onCreate`, `onUpdate`, `onDelete`, and `refetch`.

### State Management

All state is local (no global store). The `useEquipment` hook is the single source of truth for list data. Detail pages (`/equipo/:id`) fetch independently via `getEquipmentById`.

### Routes

| Route | Component |
|---|---|
| `/equipo/` | `EquipoPage` — paginated list with search + filters |
| `/equipo/:equipmentId` | `EquipmentDetailPage` — single item full detail |

---

## Backend (Supabase)

### Table: `equipment`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` (PK) | Auto-generated |
| `tenant_id` | `uuid` (FK → tenants) | RLS isolation |
| `name` | `text` | Display name |
| `description` | `text?` | Optional detail |
| `type` | `text` | Equipment category (enum-like) |
| `status` | `text` | `disponible` / `mantenimiento` / `no_disponible` |
| `quantity` | `int` | Stock count |
| `image_url` | `text?` | Storage bucket reference |
| `created_at` / `created_by` | `timestamptz` / `uuid` | Audit fields |
| `updated_at` / `updated_by` | `timestamptz` / `uuid` | Audit fields |

### RLS

Row-level security enforces `tenant_id = auth.jwt() ->> 'tenant_id'` on all operations.

### Storage

Equipment images are uploaded to the `equipment-images` bucket via `uploadEquipmentImage`. Paths follow `{tenantId}/{timestamp}-{filename}`.

---

## API Layer (`src/features/equipo/api/`)

One function per file per Screaming Architecture standards:

| File | Operation |
|---|---|
| `get-equipment.ts` | Paginated + filtered list query with `.range()` |
| `get-equipment-by-id.ts` | Single item fetch by UUID |
| `create-equipment.ts` | `INSERT` with explicit column select |
| `update-equipment.ts` | `UPDATE` with explicit column select |
| `delete-equipment.ts` | `DELETE` by ID |
| `upload-equipment-image.ts` | Storage bucket upload |

All queries list columns explicitly — no wildcard `select('*')`.
