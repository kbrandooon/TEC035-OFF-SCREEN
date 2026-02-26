---
name: documentation-protocol
description: Specialized protocol for generating Technical, Functional, and User documentation for the "Off-Screen" ERP. Use this when documenting new features, refactored modules, or entire system layers.
---

# Documentation Protocol

This skill guides the creation of a comprehensive three-layered documentation suite for the "Off-Screen" ERP system.

## Documentation Layers

### 1. Technical Documentation (Architectural)

Focuses on "How it's built".

- **System Architecture**: Screaming Architecture, folder structure, and data flow.
- **Database Schema**: Supabase tables, relationships, and RLS policies.
- **API & Logic**: TanStack hooks, inventory availability logic, and state management.

### 2. Functional Documentation (By Scope)

Focuses on "What it does".

- **Inventory Module**: Stock management, categories, tracking.
- **Reservation Module**: Rental process, date-based availability, booking.
- **Financial Module**: Transaction logging, account types.

### 3. User Documentation (End-User Manual)

Focuses on "How to use it".

- **Warehouse Staff**: Step-by-step guides for inventory entry.
- **Sales Staff**: Step-by-step guides for creating reservations.

## Formatting Rules

- **Format**: All files must be in Markdown (`.md`).
- **Naming**: Use `kebab-case` for file names (e.g., `technical-architecture.md`).
- **Tone**: Professional, clear, and instructional.
- **Visuals**: Use Mermaid.js syntax for diagrams (ERDs, Flowcharts, Sequence Diagrams).
- **Structure**: Use a clear hierarchy with H1 for titles and H2/H3 for sections.

## Step-by-Step Guide

### 1. Analysis

- Identify the module or scope to document.
- Review the code, database schema, and existing refactoring justifications.

### 2. Layering

- Determine which of the three layers (Technical, Functional, User) are required for the current task.
- Group documentation into logical files following the naming convention.

### 3. Drafting

- **Technical**: Explain the _why_ and _how_ of the implementation. Use code snippets and Mermaid diagrams.
- **Functional**: Describe the business logic and system behaviors.
- **User**: Write simplified, task-oriented guides with clear steps.

### 4. Verification

- Cross-reference documentation with the actual code to ensure accuracy.
- Check Mermaid.js syntax for rendering errors.
- Ensure all filenames are in `kebab-case`.

## Document Checklist

- [ ] File names use `kebab-case`.
- [ ] Technical layer includes Architecture, DB, and API sections.
- [ ] Functional layer covers business intent and module scope.
- [ ] User layer is written for the target persona (Warehouse/Sales).
- [ ] At least one Mermaid.js diagram is used where complex logic/schema exists.
- [ ] Tone is professional and instructional.
