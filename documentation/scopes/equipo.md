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

### Hook: `useEquipmentStats`

Fetches per-type equipment availability for **today** using TanStack Query. Configured with:

- `staleTime: 0` — always refetches on component mount (e.g., when navigating back to Dashboard).
- `refetchOnWindowFocus: true` — updates when the browser tab regains focus.
- `refetchInterval: 60_000` — background refresh every 60 seconds.

The query key `equipment-stats-today` is invalidated automatically by `useReservations` after any CRUD mutation so the Dashboard "Status de Inventario" widget always reflects live data.

### State Management

All state is local (no global store). The `useEquipment` hook is the single source of truth for list data. Detail pages (`/equipo/:id`) fetch independently via `getEquipmentById`.

### Routes

| Route | Component |
|---|---|
| `/equipo/` | `EquipoPage` — paginated list with search + filters |
| `/equipo/:equipmentId` | `EquipmentDetailPage` — single item full detail |
| `/equipo/disponibilidad` | `EquipoDisponibilidadPage` — time-based availability view |

---

## Backend (Supabase)

### Table: `equipment`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` (PK) | Auto-generated |
| `tenant_id` | `uuid` (FK → tenants) | RLS isolation |
| `name` | `text` | Display name |
| `description` | `text?` | Optional detail |
| `type` | `text` | Equipment category enum: `camara`, `lente`, `iluminacion`, `tramoya`, `audio`, `video`, `estudio`, `otros_accesorios` |
| `status` | `text` | `disponible` / `mantenimiento` / `no_disponible` |
| `quantity` | `int` | Total owned units |
| `daily_rate` | `numeric` | Rate per day for billing |
| `image_url` | `text?` | Storage bucket reference |
| `created_at` / `created_by` | `timestamptz` / `uuid` | Audit fields |
| `updated_at` / `updated_by` | `timestamptz` / `uuid` | Audit fields |

### RLS

Row-level security enforces `tenant_id = auth.jwt() ->> 'tenant_id'` on all operations.

### Storage

Equipment images are uploaded to the `equipment-images` bucket via `uploadEquipmentImage`. Paths follow `{tenantId}/{timestamp}-{filename}`.

### RPC: `get_today_equipment_stats()`

> [!IMPORTANT]
> Replaces the old `v_equipment_stats` view. The view only used the static `status = 'disponible'` flag; this RPC subtracts actively committed units from reservations overlapping today.

Calculates per-type equipment availability for the **current calendar day**:

- **Window**: `[current_date 00:00:00, current_date 23:59:59]`
- **Formula**: `today_available = SUM(quantity_by_type) − SUM(committed_today_by_type)`
- **Committed**: Units reserved in any `pending` or `confirmed` reservation whose `occupied_range` overlaps the daily window.
- **Result**: Floored at 0 per type.

```sql
-- Returns: (type text, total bigint, today_available bigint)
select * from get_today_equipment_stats();
```

Used by `getEquipmentStats` → `useEquipmentStats` → Dashboard "Status de Inventario" widget.

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
| `get-equipment-stats.ts` | Calls `get_today_equipment_stats()` RPC; returns per-type `{ type, available, total }` for today |

All queries list columns explicitly — no wildcard `select('*')`.
