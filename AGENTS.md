# AGENTS.md

## Repository Context

This repository distributes reusable QA agents, skills, rules and project profiles.

## Principles

- `.agents/skills/` contains reusable knowledge.
- `.agents/agents/` contains agent roles.
- `.agents/rules/` contains cross-project rules.
- `projects/` composes agents, skills and rules by project type.
- Consumer projects keep their own generated `AGENTS.md`.
- `qa-skills init` generates context; it does not install or change project type.
- `qa-skills update` updates only already-installed components.
