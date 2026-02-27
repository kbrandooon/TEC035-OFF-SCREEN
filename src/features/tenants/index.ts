// ── Public barrier for the `tenants` feature ─────────────────────────────────
// Routes and other features MUST import from here, not from internal paths.

export { getMyTenants } from './api/get-my-tenants'
export { switchActiveTenant } from './api/switch-active-tenant'
export { TenantSwitcher } from './components/tenant-switcher'
