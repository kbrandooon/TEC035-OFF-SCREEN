# Scope: Inventario (Inventory Movement Log)

## Overview

The **Inventario** feature records stock movements for each equipment item. Every movement is classified as an **Entrada** (stock in), **Salida** (stock out), or **Ajuste** (manual adjustment). The module provides paginated browsing with server-side date-range and movement-type filters, plus row-click detail/edit/delete modals.

---

## Frontend

### Location

`src/features/inventario/`

### Key Components

| Component | Purpose |
|---|---|
| `InventoryList` | Scrollable movement log; each row is clickable (calls `onSelect`) |
| `InventoryCreateModal` | Backdrop-blur overlay for registering a new movement (matches edit form style) |
| `InventoryDetailModal` | Backdrop-blur overlay showing full movement detail; supports inline edit and delete |

### Hook: `useInventory`

Manages a paginated, filtered movement list. Accepts:

- `page` (1-based)
- `dateFrom` / `dateTo` — ISO date strings applied as `.gte` / `.lte` on `date` column
- `movementType` — exact match on `movement_type`

Exposes `inventory`, `total`, `totalPages`, `isLoading`, `error`, `refetch`, `onCreate`.

### Routes

| Route | Component |
|---|---|
| `/inventario` | `InventarioPage` — filter bar + paginated list + modals |

### Filter Bar

A white card panel above the list contains:
- **Desde / Hasta** — date inputs with calendar icons
- **Tipo chips** — Todos / Entrada / Salida / Ajuste pill buttons
- **Limpiar** — reset button (visible only when filters are active)
- **Results count badge** — always visible, updates with filter changes

All filters are applied server-side before the SQL `.range()`. Any filter change resets `page` to 1.

---

## Backend (Supabase)

### Table: `inventory`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` (PK) | Auto-generated |
| `tenant_id` | `uuid` (FK → tenants) | RLS isolation |
| `equipment_id` | `uuid` (FK → equipment) | The item being tracked |
| `date` | `date` | Movement date |
| `movement_type` | `text` | `in` / `out` / `adjustment` |
| `quantity` | `int` | Units moved |
| `clasification` | `text?` | Free-form category label |
| `description` | `text?` | Optional notes |
| `created_at` / `created_by` | `timestamptz` / `uuid` | Audit fields |

### RLS

Row-level security enforces `tenant_id = auth.jwt() ->> 'tenant_id'` on all operations.

### View: `v_inventory_movements`

Pre-joins `inventory ← equipment` to expose `equipment_name` as a plain column.

> [!IMPORTANT]
> This view uses `security_invoker = true`, ensuring it strictly enforces the same RLS policies as the base `inventory` and `equipment` tables.

```sql
create or replace view v_inventory_movements with (security_invoker = true) as
  select i.*, e.name as equipment_name
  from inventory i
  left join equipment e on e.id = i.equipment_id;
```

---

## API Layer (`src/features/inventario/api/`)

One function per file per Screaming Architecture standards:

| File | Operation |
|---|---|
| `get-inventory.ts` | Queries `v_inventory_movements`; paginated + filtered with `.range()` and date/type filters |
| `create-inventory.ts` | `INSERT` new movement |
| `update-inventory.ts` | `UPDATE` existing movement by ID |
| `delete-inventory.ts` | `DELETE` movement by ID |

All queries list columns explicitly — no wildcard `select('*')`.
