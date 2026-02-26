---
name: clean-code-documentation
description: Skill for documenting clean code, ensuring concise function summaries, detailed parameter explanations, and the elimination of redundant or "Captain Obvious" comments. Use this when writing React components, hooks, or utility functions.
---

# Clean Code Documentation

Maintain the highest standards of code clarity by focusing on intentional documentation that explains the "Why" and provides essential context without cluttering the codebase with redundant information.

## Core Principles

1. **Be Concise**: Keep function and class summaries brief and to the point.
2. **Explaining Parameters**: Always provide clear, specific descriptions for every parameter.
3. **No "Captain Obvious"**: Forbid comments that merely restate the code. If the code is self-explanatory, do not comment on its implementation.
4. **Focus on the "Why"**: Documentation should explain the rationale behind complex logic or specific business rules.

## Documentation Standards

### JSDoc / TSDoc Layout

Every exported function, hook, or complex utility MUST follow this structure:

- **Summary**: A single-sentence description of the function's purpose.
- **@param**: Explicit explanation for each parameter, including its role or constraints.
- **@returns**: Clear description of the return value.

#### Example (React Hook):

```typescript
/**
 * Synchronizes local state with browser localStorage.
 * @param key - The unique identifier for storage.
 * @param initialValue - The fallback value if storage is empty.
 * @returns A stateful value and a function to update it.
 */
export function useLocalStorage<T>(key: string, initialValue: T) { ... }
```

### Inline Comments

Use inline comments ONLY for:

- Rationale behind non-obvious implementation details.
- Documenting specific business requirements that dictate the logic.
- Workarounds for third-party library limitations or bugs.

**Do NOT use inline comments for:**

- `// Set loading to true`
- `// Map over items`
- `// Return the result`

## Clean Code Integration

Documentation should complement clean code, not replace it. Follow these rules before adding documentation:

1. **Meaningful Names**: Use descriptive variable and function names so that comments are less necessary.
2. **Small Functions**: Break down large functions into smaller, single-purpose functions with descriptive names.
3. **Explicit Typing**: Leverage TypeScript to make the code's intent clear through types.

## Checklist

- [ ] Is the function summary concise and focused on intent?
- [ ] Is every parameter explicitly documented with its purpose?
- [ ] Are there any "Captain Obvious" comments to remove?
- [ ] Do inline comments explain "Why" and not "How"?
- [ ] Could the code be made clearer through better naming instead of comments?
