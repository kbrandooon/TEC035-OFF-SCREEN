# 📘 Unified Strategic Documentation Framework

This document integrates **Agent Memory Templates**, **Expert Documentation Skills**, and **Senior Technical Writer** standards. Use this framework to generate documentation for any feature or code block.

---

## 🛠️ Phase 1: Code-Level Standards (The Foundation)

Before documenting, ensure the code follows these standards:

### 1. JSDoc / TSDoc (The "What")

Every exported member MUST have a documentation block.

- **Description**: Concise summary.
- **@param**: Explicit explanation for each parameter.
- **@returns**: Clear description of the return value.

### 2. Inline Comments (The "Why")

- **Bad**: `setLoading(true); // Sets loading to true`
- **Good**: `// We use a small delay here to prevent flickering on fast connections`
- **Good**: `// Workaround for known issue in library X version Y`

### 3. Changelog Management

Follow [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) principles:

- **Categories**: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`.
- **Commits**: Use `<type>(<scope>): <description>` (e.g., `feat(auth): add MFA`).

---

## 📁 Phase 2: Mandatory Output Files

For every scope or feature, generate **three distinct files** in English.

### 📄 File 1: `src/features/{feature}/docs/technical.md`

**Audience:** Senior Developers & Architects | **Tone:** Professional, precise.

# Technical Documentation: {Feature Name}

## 1. Overview

High-level technical summary of what this feature solves and how it fits into the application.

## 2. Architecture & Logic

- **State Management**: (e.g., TanStack Query for caching, Zustand for global UI).
- **Data Flow**: (e.g., Fetch in hook -> Transform in util -> Render in Component).
- **Database Interactions**:
  - Tables/Views: `table_name` (READ/UPDATE).
  - RPCs/Triggers: Logic, parameters, and return types.

## 3. API & Function Reference

| Function/Method | Parameters   | Returns         | Description                    |
| :-------------- | :----------- | :-------------- | :----------------------------- |
| `getUserData`   | `id: string` | `Promise<User>` | Fetches profile from Supabase. |

## 4. Complexity & Performance

- **Complexity**: Use LaTeX for analysis (e.g., $O(n \log n)$).
- **Performance**: Impact on bundle size or render cycles.

## 5. Key Decisions & Trade-offs

- _Why X over Y_: Explain why a specific library or pattern was chosen.

## 6. Gotchas & Edge Cases

- **WARNING**: Document critical dependencies or common failure points (e.g., "Requires parent ID or throws 404").

---

### 📄 File 2: `src/features/{feature}/docs/user_guide.md`

**Audience:** Non-technical users & PMs | **Tone:** Helpful, jargon-free.

# User Guide: {Feature Name}

## What is this?

A simple explanation of the feature's value proposition.

## Prerequisites

What is needed before using this (permissions, accounts, etc.)?

## How to use it

1. **Step One**: Action description.
2. **Step Two**: Action description.

## FAQs & Troubleshooting

- **Q**: Why can't I see the button?
- **A**: Ensure you have "Admin" permissions in settings.

## Visual Descriptions

Textual description of the UI elements and expected layout/outputs.

---

### 📄 File 3: `src/features/{feature}/docs/walkthrough.md`

**Audience:** Junior Developers & Reviewers | **Tone:** Educational, analytical.

# Code Walkthrough: {Feature Name}

## 1. Execution Flow

Describe the sequence of events from the moment the user interacts until the state is updated.

## 2. Block-by-Block Analysis

Break the code into logical chunks:

- **Block A**: Explain **what** it does (syntax) and **why** (intent).
- **Highlight**: "Uses a spreading syntax `...` to clone the object to ensure immutability."

## 3. Critical Logic Highlights

Point out specific lines where "magic" happens or where bugs are most likely to occur.

---

## ✅ Final Documentation Checklist

- [ ] Does every exported member have a JSDoc block?
- [ ] Are inline comments explaining the "Why" and not the "How"?
- [ ] Is the code self-documenting through clear naming?
- [ ] Has the `CHANGELOG.md` been updated?
- [ ] Are all 3 files generated and correctly located?
