---
trigger: always_on
---

# Critical Constraints & Best Practices

All the code must be English, except when explicitly requested.

## 1. Database (Supabase)

- **NO WILDCARD SELECTS:** Never use `.select('*')` or `.select()`.
- **Explicit Columns:** Always list specific columns: `.select('id, username, avatar_url')`.
- **Reason:** Performance (network payload) and Security (prevent leaking fields).

## 2. Performance & Imports

- **Tree Shaking:** Avoid barrel exports for huge libraries.
  - ❌ `import * as _ from 'lodash'`
  - ✅ `import { debounce } from 'lodash'`
- **React Optimization:** Use `useMemo` and `useCallback` for expensive calculations or reference stability in props.

## 3. Code Style & Safety

- **Destructuring Mandatory:**
  - Always destructure `props`.
  - Destructure objects before usage.
  - **Guard Clause Pattern:** Check for null/undefined _before_ destructuring.
  - ❌ `if (!props.user) return; return <div>{props.user.name}</div>`
  - ✅ `if (!user) return null; const { name } = user; return <div>{name}</div>`
- **Type Safety:** No `any`. Define interfaces in the `types/` folder of the feature or globally if shared.

# Documentation Standards

Every exported function requires JSDoc.

- **What:** Concise description.
- **@param:** Explain inputs.
- **@returns:** Explain outputs.
- **No "Captain Obvious" comments:** Do not explain _what_ the code is doing (e.g., `// loop through items`). Explain _why_ (business logic).
