---
trigger: always_on
---

# Core Architectural Principle: Screaming Architecture

1.  **Feature-First Organization:** Never organize by technical type at the root level.
    - ❌ `src/hooks/useAuth.ts`
    - ✅ `src/features/auth/hooks/use_auth.ts`
2.  **Co-location:** Everything related to a specific business feature (components, hooks, api, types) MUST live inside that feature's folder.
3.  **Encapsulation:** Features interact via their public `index.ts`. Internal parts of a feature should not be imported directly by other features.

# Directory Structure (Strict)

Adhere to this map. If a file involves a specific business domain, it goes into `features/`. Use **kebab-case** for file names as requested.
src/
├── features/ # BUSINESS LOGIC
│ ├── auth/ # Feature Domain
│ │ ├── components/ # Feature-specific UI
│ │ ├── hooks/ # Feature-specific logic
│ │ ├── api/ # API calls specific to feature
│ │ ├── types/ # Feature-specific interfaces
│ │ └── index.ts # Public Barrier (Exports)
├── components/ # SHARED UI (Dumb, stateless, reusable primitives like buttons, inputs) ├── layouts/ # Global page layouts
├── lib/ # 3rd party configs (axios, supabase client)
├── hooks/ # SHARED hooks (generic only, e.g., use_on_click_outside)
├── utils/ # SHARED utilities (formatting, validation)
├── schemas/ # DB/Validation schemas
│ │ └── enums/ # Project enums
│ ├── profiles.ts
│ ├── profiles.ts
│ └── index.ts
└── routes/ # TanStack Router configuration
