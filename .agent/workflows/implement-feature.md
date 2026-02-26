---
description: Comprehensive workflow for implementing new features, covering database design, migrations, and frontend development.
---

1. **Phase 1: Database Design & Planning**
   - **Requirement**: Verify if an SQL, ER, or Mermaid diagram for the new feature has been provided.
   - **Requirement**: Verify if a UX Design (Figma link, Screenshot, or detailed wireframe) has been provided.
   - **Input**: Ask the user for the preferred **language** (e.g., 'en', 'es') for the frontend UI text and labels.
   - **Action**: If any of the above (Diagram, UX Design, Language) is missing, requesting them from the user is MANDATORY. Do not proceed without them.
   - **Architectural Suggestion**: Analyze the database requirements. If the feature involves complex data transformations, frequent joins, or specific security logic that can be encapsulated in SQL, suggest creating a **PostgreSQL View** to the user (ONLY in specific cases where it clearly improves frontend complexity or performance).

2. **Phase 2: Database Implementation**
   - Generate a new migration file based on the schema changes:
     // turbo
     `supabase db diff -f {summary}`
   - Synchronize TypeScript definitions with the updated local database:
     // turbo
     `supabase gen types typescript --local > ./src/supabase/types.ts`
   - Apply the changes and reset the local database for consistency:
     // turbo
     `supabase db reset --debug`

3. **Phase 3: Frontend Development & Skill Review**
   - **Skill Review**: Before implementation, review all relevant project skills to ensure compliance with standards:
     - `architect-protocol`.
     - `expert-rbac`.
     - `tanstack-best-practices`.
     - `screaming-architecture`: For feature-based organization.
     - `react-best-practices`: For performance and component structure.
     - `supabase-postgres-best-practices`: For Query and Schema standards.
     - `clean-code-documentation`: For JSDoc/TSDoc standards.
     - `kebab-case-naming`: For files and functions naming.
     - `expert documentation`: For documentate each created feature in its scope.

   - **Architecture**: Implement the feature within the `src/features/{FeatureName}` directory, maintaining strict encapsulation and co-location.
   - **Data Fetching**: Ensure NO wildcard selects (`.select('*')`) are used. List all required columns explicitly.
   - **Documentation**: All exported functions, hooks, and components MUST have JSDoc/TSDoc headers describing their purpose, parameters, and return values.

4. **Phase 4: Documentation (Expert Skill)**
   - **Backend Documentation**: Update `/documentation/scopes` to reflect any new Tables, Views, RPCs, or Edge Functions created in its corresponding scope.
   - **Frontend Documentation**: Documentate in `/documentation/scopes` explaining the new feature's intent, core logic, and key components.
   - **Changelog**: Update `CHANGELOG.md` following the "Keep a Changelog" format. Classify changes correctly (Added, Changed, Fixed, etc.).

5. **Phase 5: Verification**
   - Test the new feature thoroughly (database logic, API calls, and UI components).
   - Ensure the implementation aligns with the provided design diagram.
   - Ensure all components have functionallity.
   - Avoid import or select \*.
   - API's files has to be one function by file.
   - Ensure follow screaming architecture.

6. **Phase 6: Code Quality**
   - Run bun run lint
   - Run bun run knip
   - Run bun run format
   - Run bun run build
     if something break solve issues and re-run.
