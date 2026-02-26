# Code Review Workflow Example

This document demonstrates how to use the Code Reviewer skill in a typical development workflow.

---

## Scenario: Pre-Commit Review

You've made changes to several files and want to ensure they meet code quality standards before committing.

### Step 1: Detect Modified Files

```bash
node .agent/skills/reviewer_code/scripts/detect-modified-files.js --all
```

**Output:**

```json
{
  "staged": ["src/features/inventory/hooks/use-inventory.ts"],
  "unstaged": ["src/features/products/components/product-form.tsx"],
  "all": [
    "src/features/inventory/hooks/use-inventory.ts",
    "src/features/products/components/product-form.tsx"
  ],
  "count": {
    "staged": 1,
    "unstaged": 1,
    "total": 2
  }
}
```

### Step 2: Check Supabase Query Patterns

```bash
node .agent/skills/reviewer_code/scripts/check-supabase-queries.js \
  src/features/inventory/hooks/use-inventory.ts \
  src/features/products/components/product-form.tsx
```

**Output:**

```json
{
  "totalViolations": 1,
  "violations": [
    {
      "file": "src/features/inventory/hooks/use-inventory.ts",
      "line": 42,
      "column": 15,
      "pattern": ".select('*')",
      "severity": "error",
      "message": "Forbidden: .select('*') detected. Use explicit column list.",
      "suggestion": "Replace with .select('column1, column2, ...')"
    }
  ],
  "summary": {
    "byPattern": {
      ".select('*')": 1
    },
    "byFile": {
      "src/features/inventory/hooks/use-inventory.ts": 1
    }
  }
}
```

### Step 3: Check Import Patterns

```bash
node .agent/skills/reviewer_code/scripts/check-imports.js \
  src/features/inventory/hooks/use-inventory.ts \
  src/features/products/components/product-form.tsx
```

**Output:**

```json
{
  "totalViolations": 0,
  "violations": [],
  "summary": {
    "byPattern": {},
    "byFile": {},
    "bySeverity": {}
  }
}
```

### Step 4: Manual Review Checklist

For each modified file, verify:

#### Architecture & Organization

- [ ] Feature-specific code is co-located within feature folders
- [ ] Shared components are truly reusable and stateless
- [ ] Features expose public APIs via `index.ts`

#### Code Quality

- [ ] Functional components with TypeScript interfaces
- [ ] Props and objects are destructured
- [ ] Null safety guards before destructuring
- [ ] No `any` types

#### Documentation

- [ ] Exported functions have JSDoc with `@param` and `@returns`
- [ ] No "captain obvious" comments
- [ ] Complex logic has explanatory comments (why, not how)

#### Performance

- [ ] No unnecessary re-renders
- [ ] Expensive calculations are memoized
- [ ] Proper error handling

### Step 5: Fix Violations

**Example: Fixing Supabase Query**

**Before:**

```typescript
const { data } = await supabase
  .from('inventory_movements')
  .select('*')
  .eq('product_id', productId)
```

**After:**

```typescript
const { data } = await supabase
  .from('inventory_movements')
  .select('id, product_id, quantity, movement_type, created_at')
  .eq('product_id', productId)
```

### Step 6: Re-run Checks

```bash
node .agent/skills/reviewer_code/scripts/check-supabase-queries.js \
  src/features/inventory/hooks/use-inventory.ts
```

**Output:**

```json
{
  "totalViolations": 0,
  "violations": [],
  "summary": {
    "byPattern": {},
    "byFile": {}
  }
}
```

### Step 7: Commit

```bash
git add .
git commit -m "feat(inventory): add inventory tracking hook"
```

---

## Integration with Git Hooks

You can integrate these checks into your git workflow using Husky:

**`.husky/pre-commit`:**

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run code review checks
echo "🔍 Running code review checks..."

# Check Supabase queries
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx|js|jsx)$')

if [ -n "$STAGED_FILES" ]; then
  node .agent/skills/reviewer_code/scripts/check-supabase-queries.js $STAGED_FILES

  if [ $? -ne 0 ]; then
    echo "❌ Supabase query violations found. Please fix before committing."
    exit 1
  fi

  node .agent/skills/reviewer_code/scripts/check-imports.js $STAGED_FILES

  if [ $? -ne 0 ]; then
    echo "⚠️  Import violations found. Please review."
  fi
fi

echo "✅ Code review checks passed!"
```

---

## Agent Usage

When the agent uses this skill, it will:

1. **Detect** modified files using the detection script
2. **Run** automated checks (Supabase queries, imports)
3. **Analyze** files using `view_file` and `grep_search` for manual checks
4. **Fix** violations using `replace_file_content` or `multi_replace_file_content`
5. **Report** all findings and corrections made

The agent will prioritize auto-fixable violations and flag subjective issues for user review.
