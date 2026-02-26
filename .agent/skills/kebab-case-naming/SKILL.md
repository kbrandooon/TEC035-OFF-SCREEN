---
name: kebab-case-naming
description: Enforces kebab-case naming conventions for all files, directories, and assets in the project. Use this when creating new files, refactoring directories, or naming UI components and CSS classes.
---

# Kebab-Case Naming Convention

This skill enforces a strict **kebab-case** naming standard across the entire project to ensure consistency, URL-friendliness, and a modern development experience.

## Core Principles

1.  **Uniformity**: Every file and directory must follow the same naming pattern.
2.  **Readability**: Kebab-case (`example-file-name`) is highly readable and standard for web assets.
3.  **Cross-Platform Safety**: Avoids issues with case-insensitive file systems (e.g., Windows vs. Linux).

## Naming Rules

### 1. Directories

All directories in `src/`, `public/`, and other project folders must be kebab-case.

- **BAD**: `src/UserDashboard/`, `src/Auth/`
- **GOOD**: `src/user-dashboard/`, `src/auth/`

### 2. Files

All code files, assets, and configuration files must be kebab-case.

- **BAD**: `UserProfile.tsx`, `useAuth.ts`, `MainLayout.css`
- **GOOD**: `user-profile.tsx`, `use-auth.ts`, `main-layout.css`

### 3. Components (Files vs. Code)

While the **file** must be kebab-case, the **React component** itself inside the file should remain **PascalCase** per React standards.

- **File Name**: `submit-button.tsx`
- **Component Name**: `export const SubmitButton = () => { ... }`

### 4. CSS and Assets

All CSS class names (if not using Tailwind), images, and other assets must follow kebab-case.

- **CSS Class**: `.submit-button-container`
- **Image**: `hero-background.jpg`

## Checklist for New Files/Features

- [ ] Is the folder name in kebab-case?
- [ ] Is the file name in kebab-case?
- [ ] Are assets (images/icons) named with kebab-case?
- [ ] If using CSS modules or standard CSS, are class names kebab-case?

## Refactoring Guide

When refactoring existing PascalCase or camelCase files:

1.  Rename the file/folder using kebab-case.
2.  Update all imports in the project to reflect the new naming.
3.  Verify that the build passes and no paths are broken.
