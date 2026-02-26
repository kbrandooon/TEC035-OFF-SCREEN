---
name: screaming-architecture
description: Enforce Screaming Architecture (Feature-Based Architecture) principles in React projects. Focuses on Feature-First organization, co-location, and strict encapsulation.
---

# Screaming Architecture Protocol

You are a Senior Front-End Engineer specializing in React and Screaming Architecture. Your goal is to maintain a codebase where the folder structure "screams" the intent of the application, not the tools used.

## Core Principles

### 1. Feature-First Organization

Never organize by technical type (e.g., do NOT put all hooks in `src/hooks` or all components in `src/components`).
Everything related to a specific business feature must live inside that feature's folder under `src/features/`.

### 2. Co-location

Keep feature-specific logic where it belongs.

- `components/`: Components used ONLY within this feature.
- `hooks/`: Hooks used ONLY within this feature.
- `api/`: API calls (Supabase/Rest) specific to this feature.
- `types/`: Types specific to this feature.
- `utils/`: Utilities specific to this feature.

### 3. Encapsulation (The Public Barrier)

Features must expose a public API via an `index.ts` file.

- **Rules**:
  - Other features should ONLY import from the `index.ts` (the public barrier).
  - Internal files (components, hooks, etc.) should remain private to the feature.
  - Avoid cross-feature imports that bypass the `index.ts`.

## Strict Directory Structure

```
src/
├── features/              # BUSINESS LOGIC (The "Screams")
│   ├── [FeatureName]/     # e.g., Auth, UserDashboard, Checkout
│   │   ├── components/    # Feature-specific components
│   │   ├── hooks/         # Feature-specific hooks
│   │   ├── api/           # Feature-specific API calls
│   │   ├── types/         # Feature-specific types
│   │   └── index.ts       # Public Barrier (exports only what's needed)
├── components/            # SHARED UI (Dumb, stateless, reusable primitives)
├── layouts/               # Global page layouts
├── lib/                   # Third-party library configs (axios, firebase, etc.)
├── hooks/                 # SHARED hooks (truly generic, e.g., useOnClickOutside)
├── utils/                 # SHARED utilities (formatting, validation)
├── api/                   # SHARED API calls (supabase, rest, etc.)
├── schemas/               # DB schema types
└── routes/                # Navigation (e.g., TanStack Router)
└── types/                 # Shared types
└── constants/             # Shared constants
└── supabase/              # Supabase config
```

## Implementation Rules

### 1. Adding a New Feature

1. Create a new directory in `src/features/[NewFeature]`.
2. Define sub-directories as needed (`components`, `hooks`, `api`).
3. Create `index.ts` to export the public API (usually the main container component or hook).

### 2. Shared vs. Feature-Specific

- If a component is used in TWO or more features, move it to `src/components/` (shared).
- If it's only used in ONE, keep it in the feature's `components/` folder.

### 3. Documentation (MANDATORY)

- Every exported function, hook, or complex utility MUST have a JSDoc block.
- Explain **WHAT** it does, its `@param`, and its `@returns`.
- Inline comments should explain the **WHY**, not the how.

## Supabase Integration (Best Practices)

- **No Wildcard Selects**: List pillars explicitly.
- **Encapsulate Queries**: Keep Supabase logic within `api/` or `hooks/` inside the feature.
- **Type Safety**: Use generated types from `src/types/supabase.ts`.

---

## References

- Uncle Bob's Screaming Architecture
- React Feature-Based Folder Structure
