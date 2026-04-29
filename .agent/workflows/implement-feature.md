---
description: Comprehensive workflow for implementing new features, covering database design, migrations, and frontend development.
---

# 🔄 Workflow: Feature Development

**Description:** Comprehensive workflow for implementing new features, focusing on strict architecture, frontend excellence, and "Memory Lock" documentation.
**Trigger:** Execute this workflow immediately whenever a Feature is created or modified.

---

## 🚫 Database Constraint

**IMPORTANT:** The database (Local and Remote) will **NOT** be modified. All implementation must rely on existing Tables, Views, RPCs, and Schemas. No new migrations or schema changes are permitted.

---

## Phase 1: Context & Planning (Crucial)

### 1.1 Context Loading

- **IF modifying an existing feature:** **READ** `src/features/{feature_name}/docs/technical.md` **FIRST** to understand the "Why" behind previous decisions.
- **IF creating a new feature:** Review global architecture rules to ensure the new folder location is correct (`src/features/`).

### 1.2 Requirements Gathering

Before writing code, the following must be verified/requested:

- **UX Design:** Verify if a Figma link, Screenshot, or detailed wireframe is provided. If not, verify existing components, design, design patterns, colors.

---

## Phase 2: Architecture & Skill Review

### 2.1 Skill Alignment

Review all relevant project skills to ensure compliance:

- **Screaming Architecture:** Only import exactly what is needed; strict feature-based organization.
- **TanStack & React Best Practices:** Functional components, custom hooks, strict prop destructuring, and efficient caching.
- **Supabase/Postgres:** Explicit selects only. **No `select('*')`**.
- **Clean Code & Naming:** Use `kebab-case-naming` for files and functions. JSDoc/TSDoc standards applied everywhere.
- **RBAC & Protocols:** Adhere to `architect-protocol` and `expert-rbac` where applicable.

### 2.2 Scaffold Structure

If the feature is new, strictly create the following directory tree:

```text
src/features/{feature_name}/
├── api/          # Supabase queries (One function per file!)
├── components/   # Feature-specific UI (Reuse global components where possible)
├── hooks/        # Logical controllers/TanStack hooks
├── types/        # TypeScript interfaces
├── docs/         # 🧠 THE BRAIN (Technical & User guides)
└── index.ts      # Public API export (Export only necessary items)
```

---

## Phase 3: Implementation Standards

- **API Layer:** Ensure as few API calls as possible. Each file in `api/` must contain exactly **one** function.
- **Data Fetching:** List all required columns explicitly (e.g., `.select('id, name')`).
- **Component Reuse:** Check for existing components and reuse them. If creating a highly reusable component, add it to global folders instead of isolating it here.
- **Styling:** Use the project's styling library (e.g., Tailwind).
- **Documentation in Code:** All exported functions, hooks, and components **MUST** have JSDoc/TSDoc headers describing purpose, parameters, and return values.
- **Avoid using "any, undefined and unknown" whenever possible.**

---

## Phase 4: "The Memory Lock" (Expert Documentation)

> **Strict Requirement:** No task is complete without updating the documentation.

### Action A: Feature-Specific Docs (`src/features/{feature}/docs/`)

- **`technical.md`:** Describe data flow (Supabase -> Hook -> UI), edge cases (null data, offline), and logic decisions.
- **`user_guide.md`:** Explain functionality and "How to use" in simple terms for the end user.

### Action B: Global Scopes & Logs

- **Scope Update:** Update `/documentation/scopes` to reflect the feature's intent, core logic, and key components. (Note: Since the DB is frozen, no new Tables/RPCs will be added here, but mention which existing ones are utilized).
- **Changelog:** Update `CHANGELOG.md` following "Keep a Changelog" format. Classify changes correctly (Added, Changed, Fixed, etc.).

---

## Phase 5: Verification & Quality Control

### 5.1 Self-Correction Checklist

- [ ] **Structure:** Does it follow `src/features/` encapsulation?
- [ ] **No Wildcards:** Are all Supabase selects explicit?
- [ ] **Database Integrity:** Confirm the local/remote database schema was not modified.
- [ ] **Exports:** Is the public API restricted via `index.ts`?
- [ ] **Functionality:** Are API calls, database logic, and UI components thoroughly tested?

### 5.2 Code Quality Commands

Run the following suite. If anything breaks, resolve issues and re-run until all pass cleanly:

1. `bun run lint`
2. `bun run knip`
3. `bun run format`
4. `bun run build`

---

## Phase 6: Documentation

Follow .agent/skills/documentation/SKILL.md
