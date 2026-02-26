# Strict Skill-Reading Requirement

To ensure the highest quality of code and adherence to project standards, the agent MUST strictly follow this rule:

## Rule: Read Necessary Skills First

Before starting any task, making any code modifications, or responding to a user request that involves development, you MUST:

1.  **List all available skills** in the `.agent/skills/` directory.
2.  **Identify and read** the `SKILL.md` file for skills NECESSARY for the current task.
3.  **Apply the principles** from these relevant skills to the current task.

### Rationale

This project uses several specialized protocols and best practices (Architect Protocol, Screaming Architecture, Supabase Best Practices, etc.) that are documented as skills. Failure to read these skills can lead to architectural inconsistencies and technical debt.

### Enforcement

This rule is **Always On**. You are expected to perform this check automatically at the beginning of every interaction involving technical work.
