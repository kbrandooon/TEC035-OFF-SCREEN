# StudioOS — reserva pública y esquema Supabase

## URL → tenant

- Ruta: `/reserve/:tenantSlug` (coincide con `tenants.slug`).
- Query opcional: **`?phone=`** (ej. WhatsApp) — se guarda en `sessionStorage` y rellena el campo teléfono del paso final; sobrevive al redirect de Google.
- **Pantalla previa a Google (sin sesión):** RPC **`get_tenant_display_by_slug_public(p_slug)`** (`GRANT anon, authenticated`) — solo el **nombre** del estudio para el copy de bienvenida.
- **Tras Google:** RPC **`get_tenant_by_slug_public(p_slug)`** (`GRANT authenticated`) — `id`, `name`, `slug` para el flujo con datos reales sin depender de membresía en el tenant.

## Catálogo y disponibilidad (migraciones)

- **Equipo**: tabla `equipment`, columna `tenant_id`. Tras resolver el slug, el listado de esta pantalla filtra por ese `tenant_id`.
- **Marketplace RPC**: `get_marketplace_equipment()` (`SECURITY DEFINER`) está concedida a rol **`authenticated`** (no `anon`). Por eso el flujo exige **Google OAuth** antes de cargar datos.
- **Disponibilidad en `/reserve`**: RPC **`get_equipment_availability_for_reserve_slug(p_slug, p_start, p_end, p_type?)`** (`SECURITY DEFINER`, `GRANT authenticated`). Misma fórmula que `get_equipment_availability`, acotada al `tenant_id` del slug e inlinando reservas para que el cálculo no dependa de que el usuario vea filas de `reservations` por RLS.
- **Panel interno**: `get_equipment_availability` sigue siendo `SECURITY INVOKER` y respeta RLS.

## RLS y roles

- Catálogo en pantalla: **`get_marketplace_equipment`** + filtro por `tenant_id` del slug (cualquier `authenticated`).
- Tenant y disponibilidad por ventana en `/reserve`: cubiertos por **`get_tenant_by_slug_public`** y **`get_equipment_availability_for_reserve_slug`** (ver migración `20260429130000_reserve_public_slug_rpcs.sql`).

## CRM (Lead / Opportunity)

- No hay tablas `lead` / `opportunity` en las migraciones actuales del repo. El botón final de solicitud solo prepara un **payload tipado** (consola / toast) hasta existir backend CRM.
