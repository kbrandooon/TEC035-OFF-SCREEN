---
name: refactoring-protocol
description: Systematic approach to refactoring modules following Screaming Architecture and Clean Code principles. Use this when you are tasked with refactoring a specific folder or component to ensure technical excellence and consistency.
---

# Refactoring Protocol

This skill guides the refactoring process for the "OFF-SCREEN" ERP system, ensuring that all code meets the highest standards of clean architecture, performance, and maintainability.

## Core Principles

1.  **Screaming Architecture**: Folders must represent business intent (inventory, reservations, auth, etc.) rather than technical types.
2.  **Atomicity & SoC**: High cohesion, low coupling. Logic must be separated from UI.
3.  **Strict Type Safety**: Full utilization of Supabase-generated types and Zod schemas.
4.  **Declarative Style**: Use custom hooks and functional composition to keep components clean.

## Technical Rules (Non-Negotiable)

- **Naming Conventions**:
  - Files & Folders: `kebab-case` (e.g., `inventory-management/`).
  - Constants/Env Variables: `SCREAMING_SNAKE_CASE`.
  - Components: `PascalCase`.
- **Imports**: Never use `import *`. Always use named imports.
- **Data Fetching**: Use TanStack Query (`useQuery`, `useMutation`) with centralized cache keys.
- **Logic Extraction**: Extract all logic into custom hooks.
- **Documentation**: Use JSDoc for complex functions and clear comments for business logic.

## Refactoring Checklist

- [ ] Path follows `kebab-case` naming.
- [ ] Business logic is extracted into custom hooks.
- [ ] API calls are centralized in a `-api.ts` file.
- [ ] Types are defined in a `-types.ts` or `schema.ts` file.
- [ ] No `import *` is used.
- [ ] JSDoc is present for exported functions/components.
- [ ] `bun run lint` passes.
- [ ] `bun run knip` shows no new unused code.
- [ ] `bun run build` succeeds.

## Step-by-Step Guide

### 1. Preparation

- Identify the folder or module to refactor.
- Analyze the existing code and map business logic vs. UI.
- Use the [Architect Protocol](file:///Users/kbrandooon/Documents/GitHub/TEC035-OFF-SCREEN/.agent/skills/architect-protocol/SKILL.md) to plan the changes.

### 2. Implementation

- Create the new folder structure (if necessary) following [Screaming Architecture](file:///Users/kbrandooon/Documents/GitHub/TEC035-OFF-SCREEN/.agent/skills/screaming-architecture/SKILL.md).
- Extract API logic to a dedicated file.
- Implement custom hooks for state and data management.
- Refactor UI components to be purely presentational or composed of sub-components.

### 3. Verification

- For every refactored file, justify which rule was applied.
- Run the verification suite:
  ```bash
  bun run lint
  bun run knip
  bun run format
  bun run build
  ```

### 4. Output Format

For every module/file refactored, provide:

1. **File Path**: `{path/to/file/in-kebab-case}`
2. **Refactored Code**: Complete, clean, and production-ready code block.
3. **Change Log**: Bulleted list of improvements based on the standards above.
