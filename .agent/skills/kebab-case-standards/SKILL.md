---
name: kebab-case-standards
description: Enforce kebab-case (lowercase with hyphens) naming conventions for files, directories, CSS classes, and URLs to ensure consistency and Unix-friendliness.
---

# Kebab Case Standards

## Core Principles

- **Consitency**: Unified naming across the codebase makes navigation and search predictable.
- **Unix-friendliness**: Kebab-case avoids issues with case-sensitive file systems and spaces in paths.
- **Readability**: Hyphens clearly separate words, making long names easier to scan.
- **URL-safe**: Kebab-case is the standard for URL slugs and doesn't require encoding for spaces or special characters.

## Naming Conventions

### 1. Files and Directories

- **All lowercase**: Never use capital letters.
- **Hyphenated**: Use `-` to separate words.
- **Examples**:
  - `src/user-profile/` (directory)
  - `user-card.tsx` (file)
  - `auth-service.ts` (file)

### 2. CSS Classes

- **Standard**: Follow kebab-case for all class names.
- **BEM (Optional but recommended)**: Use kebab-case for Blocks, Elements, and Modifiers.
- **Examples**:
  - `.base-button`
  - `.base-button--loading`
  - `.card-header__title`

### 3. URL Slugs

- **Standard**: Always use kebab-case for dynamic and static URL paths.
- **Examples**:
  - `/user-settings/account`
  - `/blog/how-to-use-kebab-case`

### 4. HTML Attributes and IDs

- **Standard**: Use kebab-case for customized data attributes and IDs.
- **Examples**:
  - `data-test-id="submit-button"`
  - `id="main-content"`

## Checklist

- [ ] All file names are lowercase.
- [ ] All directory names are lowercase.
- [ ] Words in file/directory names are separated by hyphens.
- [ ] No camelCase or PascalCase used for files (even React components).
- [ ] CSS classes follow kebab-case.
- [ ] URL paths are kebab-case.

## Step-by-Step Guide

1. **Check File Names**: Before creating a new file, ensure its name is in kebab-case.
2. **Rename Existing**: If you find files using camelCase or PascalCase, rename them to kebab-case and update imports.
3. **Verify Imports**: Ensure imports match the new kebab-case file names (remember that some systems are case-insensitive, but CI/CD environments might not be).
4. **Style Sheets**: Ensure all new CSS classes follow the standard.
