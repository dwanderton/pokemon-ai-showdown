---
name: skill-creation
description: Guidelines for creating new skills with proper directory structure, naming conventions, and SKILL.md format.
---

# Skill Creation Guidelines

How to create well-structured, reusable skills for this project.

## Directory Structure

```
best-practices/
  {skill-name}/           # kebab-case directory name
    SKILL.md              # Required: skill definition
    README.md             # Optional: additional documentation
    examples/             # Optional: example implementations
```

## Naming Conventions

- **Skill directory**: `kebab-case` (e.g., `log-better`, `council-process`)
- **SKILL.md**: Always uppercase, always this exact filename
- **README.md**: For additional context beyond the skill definition

## SKILL.md Format

```markdown
---
name: {skill-name}
description: {One sentence describing when to use this skill}
---

# {Skill Title}

{Brief description of what the skill does.}

## How It Works

{Numbered list explaining the skill's workflow}

## Rules

{Bulleted list of rules to follow}

## Examples

{Show 2-3 common usage patterns with code}

## Anti-Patterns

{Show what NOT to do}
```

## Best Practice Categories

| Category | Purpose |
|----------|---------|
| `council-process` | Review and decision-making processes |
| `doubt` | How to handle uncertainty |
| `react-best-practices` | React/Next.js patterns |
| `web-design-guidelines` | UI/UX standards |
| `skill-creation` | How to create new skills |
| `log-better` | Logging standards |

## When to Create a New Skill

1. A pattern is used in 3+ places
2. A mistake was made that could be prevented
3. External documentation needs to be internalized
4. A decision was made that should be remembered
