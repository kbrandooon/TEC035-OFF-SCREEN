#!/bin/bash

SKILL_NAME=$1

if [ -z "$SKILL_NAME" ]; then
  echo "Usage: $0 <skill-name>"
  exit 1
fi

SKILL_DIR=".agent/skills/$SKILL_NAME"

if [ -d "$SKILL_DIR" ]; then
  echo "Error: Skill '$SKILL_NAME' already exists at $SKILL_DIR"
  exit 1
fi

echo "Creating skill structure for: $SKILL_NAME"

mkdir -p "$SKILL_DIR/scripts"
mkdir -p "$SKILL_DIR/resources"
mkdir -p "$SKILL_DIR/examples"

cat <<EOF > "$SKILL_DIR/SKILL.md"
---
name: $SKILL_NAME
description: Provide a detailed description here for when the agent should use this skill.
---

# ${SKILL_NAME//-/ }

## Overview
Describe the purpose of this skill.

## Instructions
- Step 1
- Step 2

## Best Practices
- Practice 1
EOF

echo "Successfully created skill at $SKILL_DIR"
