// ── Public barrier for the `cliente-portal` feature ──────────────────────────
// Routes must import from here, not from internal paths.

// Types
export type { MarketplaceEquipment, CartItem } from './types'

// Components
export { ClientLayout } from './components/client-layout'
export { MarketplacePage } from './components/marketplace-page'
export { EquipmentDetailPage } from './components/equipment-detail-page'
export { CartPage } from './components/cart-page'
