---
name: skill-builder
description: Use this skill to create new Antigravity skills in the workspace. It helps maintain a consistent folder structure and ensures SKILL.md files follow the required standards.
---

# Skill Builder

This skill guides you through the process of creating a new "Skill" in this workspace.
Skills are located in the `.agent/skills/` directory.

## When to use

- When you identify a recurring complex task that could benefit from structured instructions (e.g., specific code migrations, complex architectural reviews, specialized testing).
- When the USER explicitly asks to create a new skill.

## Steps to Create a Skill

1. **Identify the Skill**: Determine the name and purpose of the skill.
2. **Initialize Structure**: Use the provided script to create the folder structure.
   ```bash
   bash .agent/skills/skill-builder/scripts/init-skill.sh <skill-name>
   ```
3. **Draft SKILL.md**: Define the YAML frontmatter and the core instructions.
   - **name**: Concise identifier (kebab-case).
   - **description**: Detailed explanation for the agent to know when to trigger it.
4. **Add Resources/Scripts**: If the skill requires templates or helper scripts, place them in the respective folders.

## SKILL.md Template

All `SKILL.md` files must follow this format:

```markdown
---
name: <unique-name>
description: <detailed-description-for-agent-triggering>
---

# <Human Readable Name>

## Core Principles

...

## Checklist

...

## Step-by-Step Guide

...
```
