# Scope: Reservas (Reservation Management)

## Overview

The **Reservas** feature manages studio and equipment rental bookings for Off Screen. Each reservation links a client to a date/time range, optional equipment items, address, and invoicing preference. Status transitions (`pending` → `confirmed` / `canceled`) are managed by the admin.

---

## Frontend

### Location

`src/features/reservas/`

### Key Components

| Component | Purpose |
|---|---|
| `ReservationFormModal` | Create/Edit reservation with date, time, client picker, equipment selector, and invoice toggle |
| `ReservationDetailModal` | Read-only overlay showing full booking detail with status badge and action buttons |
| `ReservationPreview` | Compact preview card used inside the form before submission |
| `EquipmentSelector` | Multi-select cart panel to add/remove equipment items and set quantities |

### Component: `EquipmentSelector`

The equipment catalog overlay panel. Key behaviors:

- **Blocked until date/time is set.** The "Agregar Equipo al Carrito" button is disabled with a descriptive label if the form does not yet have a complete `date + startTime + endDate + endTime` window.
- **Live availability query.** When the overlay opens with a valid window, it calls `get_equipment_availability` via TanStack Query and overlays per-card badges:
  - 🟢 `X disp.` — units available in the selected window
  - 🟡 `2 disp.` — low stock warning (≤ 2 units)
  - 🔴 `Agotado` — no units available (card disabled)
- **Equipment status blocking.** Items with `status = 'mantenimiento'` or `'no_disponible'` show a corresponding badge (🟡 / ⚫) and are disabled regardless of reservation window.
- **Quantity cap.** The `+` stepper is disabled when `item.quantity >= available` from the live availability data.
- **Category filter chips.** All filter buttons include `type='button'` to prevent accidental form submission.

### Hook: `useReservations`

Manages the full reservation list. Exposes `reservations`, `isLoading`, `error`, `onCreate`, `onUpdate`, `onUpdateStatus`, `onDelete`, and `refetch`.

> [!IMPORTANT]
> After every successful mutation, `useReservations` calls `queryClient.invalidateQueries({ queryKey: ['equipment-stats-today'] })`. This ensures the Dashboard "Status de Inventario" widget reflects the change immediately — even without navigating back to the route.

### State Management

All state is local to `useReservations`. No global store is used. The hook is the single source of truth.

### Invoice Business Rule

When `requiresInvoice = true`, the UI surfaces a VAT notice. The flag is persisted to the `requires_invoice` column and must be respected in any PDF/invoice generation step.

### Reservation Status Machine

```
pending ──► confirmed
   └──────► canceled
```

Status changes are atomic single-column updates (`updateReservationStatus`). No backward transitions are enforced at the DB level — business rules are enforced in the UI only.

### Routes

| Route | Component |
|---|---|
| `/reservas` | `ReservasPage` — calendar + list view |

---

## Backend (Supabase)

### Table: `reservations`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` (PK) | Auto-generated |
| `tenant_id` | `uuid` (FK → tenants) | RLS isolation |
| `customer_id` | `uuid` (FK → customers) | Linked client |
| `date` | `date` | Start date |
| `end_date` | `date` | End date (inclusive) |
| `start_time` | `time` | HH:MM start |
| `end_time` | `time` | HH:MM end |
| `address` | `text` | Event address |
| `notes` | `text?` | Internal notes |
| `requires_invoice` | `bool` | Invoice with VAT required |
| `equipment_items` | `jsonb` | Embedded array of `ReservationEquipmentItem` |
| `status` | `text` | `pending` / `confirmed` / `canceled` |
| `document_path` | `text?` | Optional Storage path for attached document |
| `created_at` | `timestamptz` | Audit field |

### View: `v_reservations`

Pre-joins `reservations ← customers` to expose `customer_names` and `customer_last_name` as flat columns, eliminating the inline PostgREST lateral join from the API layer.

> [!IMPORTANT]
> This view uses `security_invoker = true`, ensuring it strictly enforces the same RLS policies as the base `reservations` and `customers` tables.

```sql
create or replace view v_reservations with (security_invoker = true) as
  select
    r.id, r.tenant_id, r.date, r.end_date, r.start_time, r.end_time,
    r.customer_id, c.names as customer_names, c.last_name as customer_last_name,
    r.address, r.notes, r.requires_invoice, r.equipment_items, r.status, r.created_at
  from reservations r
  left join customers c on c.id = r.customer_id;
```

### RLS

Row-level security enforces `tenant_id = auth.jwt() ->> 'tenant_id'` on all operations.

### Storage

Optional document attachments are stored in the `reservation-documents` bucket. Deletion (`deleteReservation`) performs a best-effort `storage.remove()` after the DB row is deleted.

---

## API Layer (`src/features/reservas/api/`)

One function per file per Screaming Architecture standards:

| File | Operation |
|---|---|
| `get-reservations.ts` | Queries `v_reservations`; maps view columns to `Reservation` domain type |
| `create-reservation.ts` | `INSERT` into `reservations`; returns new `id` |
| `update-reservation.ts` | `UPDATE` all editable fields by ID |
| `update-reservation-status.ts` | `UPDATE` only the `status` column; uses `ReservationStatus` from `types/` |
| `delete-reservation.ts` | `DELETE` row + best-effort Storage cleanup |

All queries list columns explicitly — no wildcard `select('*')`.
