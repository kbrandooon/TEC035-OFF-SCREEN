---
name: Code Reviewer
description: Automated code review system that validates architecture, code quality, database patterns, and documentation standards. Detects violations and auto-corrects where possible.
---

# Code Reviewer Skill

## Overview

This skill enables comprehensive code review automation for the "OFF-SCREEN" ERP project. It validates code against established standards and auto-corrects violations where possible.

---

## When to Use This Skill

Use this skill when:

1. **Pre-Commit Review**: Before committing changes to ensure code quality
2. **Feature Completion**: After implementing a feature to validate standards compliance
3. **Refactoring**: To ensure refactored code meets all standards
4. **Pull Request Review**: To validate changes before merging
5. **On-Demand**: When the user explicitly requests a code review

---

## How to Use This Skill

### Step 1: Detect Modified Files

Run the detection script to identify files that need review:

```bash
node .agent/skills/reviewer_code/scripts/detect-modified-files.js --all
```

This returns JSON with staged, unstaged, and all modified files filtered by relevant extensions (`.ts`, `.tsx`, `.js`, `.jsx`).

### Step 2: Run Automated Checks

#### Check Supabase Query Patterns

```bash
node .agent/skills/reviewer_code/scripts/check-supabase-queries.js <file1> <file2> ...
```

**Detects:**

- `.select('*')` usage (FORBIDDEN)
- `.select()` without explicit columns (FORBIDDEN)

**Output:** JSON with violations, line numbers, and suggestions

#### Check Import Patterns

```bash
node .agent/skills/reviewer_code/scripts/check-imports.js <file1> <file2> ...
```

**Detects:**

- Wildcard imports (`import * as`)
- Non-tree-shakeable patterns (e.g., `import _ from 'lodash'`)

**Output:** JSON with violations and suggestions

### Step 3: Manual Review

For each modified file, use `view_file`, `view_code_item`, and `grep_search` to verify:

#### Architecture & Organization

- [ ] **Screaming Architecture**: Features organized by business logic, not technical type
- [ ] **Co-location**: Feature-specific code (components, hooks, API) within feature folders
- [ ] **Shared Components**: Only truly reusable, stateless primitives in `/components`
- [ ] **Encapsulation**: Features expose public APIs via `index.ts`

#### Code Quality & Best Practices

- [ ] **React**: Functional components with TypeScript interfaces, proper hooks usage
- [ ] **TypeScript**: No `any` types, proper type safety throughout
- [ ] **Destructuring**: Props and objects destructured (avoid repetitive dot notation)
- [ ] **Null Safety**: Guard clauses before destructuring potentially null/undefined objects
- [ ] **Imports**: Tree-shakeable imports only (no wildcard imports, use named exports)

#### Database (Supabase)

- [ ] **FORBIDDEN**: `.select('*')` or `.select()` without explicit columns
- [ ] **REQUIRED**: Explicit column lists in all `.select()` calls

#### Documentation

- [ ] **JSDoc**: Exported functions/hooks have JSDoc blocks with `@param` and `@returns`
- [ ] **No "Captain Obvious"**: Avoid redundant comments like `// Set the name`
- [ ] **Inline Comments**: Only for complex logic or business rules (explain "why", not "how")

#### Logic & Performance

- [ ] **Logic Errors**: Analyze for bugs and edge cases
- [ ] **Optimization**: Identify unnecessary re-renders, expensive calculations, missing memoization
- [ ] **Error Handling**: Verify proper error handling

### Step 4: Fix Violations

Use `replace_file_content` or `multi_replace_file_content` to fix violations:

**Auto-fixable violations:**

- Supabase `.select('*')` → Replace with explicit column list
- Wildcard imports → Replace with named imports
- Missing destructuring → Add destructuring
- Missing JSDoc → Add JSDoc blocks

**Manual review required:**

- Screaming Architecture violations (requires business context)
- "Captain Obvious" comments (subjective)
- Edge case analysis (requires domain knowledge)
- Performance optimizations (requires profiling)

### Step 5: Report Findings

Provide a summary of:

1. **Total files reviewed**
2. **Violations found** (by category)
3. **Auto-corrections made**
4. **Manual review items** (flagged for user)

---

## Review Standards

### Architecture & Organization

**Screaming Architecture Compliance:**

- Features organized by business domain (e.g., `inventory`, `products`, `customers`)
- Feature folders contain: `components/`, `hooks/`, `api/`, `types/`, `schemas/`, `index.ts`
- Shared components are truly reusable primitives (buttons, inputs, cards)

**Encapsulation:**

- Features expose public APIs via `index.ts`
- Internal implementation details not exported
- Clear separation between public and private APIs

### Code Quality & Best Practices

**React:**

- Functional components with TypeScript interfaces
- Proper hooks usage (no rules of hooks violations)
- Avoid unnecessary re-renders (use `memo`, `useMemo`, `useCallback` appropriately)

**TypeScript:**

- No `any` types (use `unknown` or proper types)
- Proper type safety throughout
- Interfaces for props, return types for functions

**Destructuring:**

```typescript
// ❌ Bad
function Component(props) {
  return <div>{props.name} - {props.email}</div>;
}

// ✅ Good
function Component({ name, email }) {
  return <div>{name} - {email}</div>;
}
```

**Null Safety:**

```typescript
// ❌ Bad
const { name, email } = user // user might be null

// ✅ Good
if (!user) return null
const { name, email } = user
```

**Imports:**

```typescript
// ❌ Bad
import * as utils from './utils'
import _ from 'lodash'

// ✅ Good
import { formatDate, calculateTotal } from './utils'
import { debounce } from 'lodash-es'
```

### Database (Supabase)

**FORBIDDEN:**

```typescript
// ❌ Never do this
.select('*')
.select()
```

**REQUIRED:**

```typescript
// ✅ Always do this
.select('id, name, email, created_at')
```

### Documentation

**JSDoc for Exported Functions:**

```typescript
/**
 * Fetches inventory movements for a specific product
 * @param {string} productId - The product ID to fetch movements for
 * @returns {Promise<InventoryMovement[]>} Array of inventory movements
 */
export async function fetchInventoryMovements(productId: string) {
  // ...
}
```

**Inline Comments (Only for Complex Logic):**

```typescript
// ❌ Bad (Captain Obvious)
// Set the name
setName(value)

// ✅ Good (Explains business rule)
// Apply 15% discount for planners (business rule: client_type = 'planner')
const discount = clientType === 'planner' ? 0.15 : 0
```

---

## Action Items

**ALL CORRECTIONS MUST BE IN ENGLISH**

When violations are found:

1. **Correct them immediately** (auto-fixable violations)
2. **Provide a summary** of all changes made
3. **Explain the reason** for each correction
4. **Ensure backward compatibility** where applicable
5. **Flag for manual review** (subjective or complex violations)

---

## Example Usage

See [examples/review-workflow.md](file:///Users/kbrandooon/Documents/GitHub/TEC035-OFF-SCREEN/.agent/skills/reviewer_code/examples/review-workflow.md) for a complete workflow example.

---

## Integration with Git Workflow

This skill can be integrated into git hooks (Husky) for automated pre-commit checks. See the example workflow for implementation details.
