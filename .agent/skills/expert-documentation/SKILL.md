---
name: expert-documentation
description: Expert standards for code documentation (JSDoc/TSDoc, inline comments) and changelog management. Use this skill when writing or reviewing code, or updating the project changelog.
---

# Expert Documentation Skill

Maintain the highest standards for code documentation and project history. Good documentation "screams" the intent of the code, while a well-maintained changelog provides a clear narrative of the project's evolution.

## 1. Code Documentation Standards

### JSDoc / TSDoc (The "What")

Every exported function, hook, component, or complex utility MUST have a JSDoc block.

**Mandatory Fields:**

- **Description**: A concise summary of what the element does.
- **@param**: Explicit explanation for each parameter.
- **@returns**: Clear description of the return value.

**Example:**

```typescript
/**
 * Fetches user profile data from Supabase and applies business logic filters.
 * @param userId - The UUID of the user.
 * @param includeMetadata - Whether to fetch associated account metadata.
 * @returns A promise resolving to the user profile or null if not found.
 */
export const getUserProfile = async (userId: string, includeMetadata: boolean) => { ... }
```

### Inline Comments (The "Why")

Avoid "Captain Obvious" comments. Focus on the rationale behind complex decisions.

- **Bad**: `setLoading(true); // Sets loading to true`
- **Good**: `// We use a small delay here to prevent flickering on fast connections`
- **Good**: `// Workaround for known issue in library X version Y`

## 2. Changelog Management

Follow the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) principles.

### Categories

- **Added**: For new features.
- **Changed**: For changes in existing functionality.
- **Deprecated**: For soon-to-be removed features.
- **Removed**: For now removed features.
- **Fixed**: For any bug fixes.
- **Security**: In case of vulnerabilities.

### Conventional Commits (Recommended)

Use a consistent format for commit messages to facilitate automated changelog generation.
Format: `<type>(<scope>): <description>`

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.

## 3. Project Documentation (`/documentation`)

Clear documentation of the infrastructure and feature set is required in the `/documentation` directory.

### Backend Documentation (`/documentation/scopes`)

Documentation in this folder MUST be comprehensive and reflect the database and server-side state. It must contain documentation for:

- **Tables & Views**: Schema definitions and purpose.
- **Procedures & RPCs**: Function logic, parameters, and return types.
- **Triggers**: Automation logic and execution conditions.
- **Edge Functions**: Serverless logic and entry points.
- **Buckets**: Storage structure and access policies.

### Frontend Features Documentation (`/documentation/scopes`)

Documentation in this folder MUST reflect the business logic and user interface implementation.

- Every feature must have a markdown file explaining its intent, core logic, and key components.
- State management and side effects specific to the feature must be documented.

## 3. Checklist for Documentation Review

- [ ] Does every exported member have a JSDoc block?
- [ ] Are all parameters and return values documented?
- [ ] Are inline comments explaining the "Why" and not the "How"?
- [ ] Is the code self-documenting through clear naming?
- [ ] Has the `CHANGELOG.md` been updated with relevant changes?
- [ ] Is the `/documentation/scopes` directory updated to reflect the current state?
