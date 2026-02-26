---
description: Standard Git Commit Workflow with Husky validation and optional TEC scope formatting
---

1. Ensure there are staged changes. If not, ask the user to stage changes first.
2. Run the Husky pre-commit script manually to validate the staged changes:
   // turbo
   `sh .husky/pre-commit`
3. If the validation fails, report the errors to the user and stop.
4. Ask the user for the **Project ID** and **Ticket Number** (both are optional).
5. Generate a concise summary (max 50 characters) and a detailed description of the staged changes automatically. If the user provided a summary manually, use that instead.
6. Format the commit message:
   - If **Project ID** and **Ticket Number** are provided: `feat(TEC{project_id}-{ticket_number}: {summary})`
   - If either is missing: `feat: {summary}`
7. Run the commit command with the determined message and the generated description:
   // turbo
   `git commit -m "{formatted_message}" -m "{detailed_description}"`
8. Push the changes to the current branch on origin:
   // turbo
   `git push origin HEAD`
9. Notify the user that the commit and push were successful.
