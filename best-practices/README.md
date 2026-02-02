# Best Practices

This folder contains reference documentation for maintaining code quality, design consistency, and architectural decisions in the Pokemon AI Showdown project.

## Contents

### `/council-process`
Documentation for the council review process - a structured approach to validating major decisions through three expert perspectives (Product Engineer, CTO, Designer).

### `/react-best-practices`
Performance optimization patterns from Vercel Engineering. 40+ rules across 8 categories, prioritized by impact. Contains patterns for eliminating waterfalls, bundle optimization, server-side performance, and more.

Source: [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices)

### `/web-design-guidelines`
Comprehensive interface guidelines from Vercel covering interactions, animations, layout, content, forms, performance, and design. Framework-agnostic with React/Next.js specifics.

Source: [vercel-labs/web-interface-guidelines](https://github.com/vercel-labs/web-interface-guidelines)

### `/doubt`
Guidelines for commitment and persistence - avoiding premature technology pivots and seeing decisions through with proper evaluation.

### `/skill-creation`
Template and guidelines for creating new skills in the best-practices folder. Defines structure, naming conventions, and content requirements.

### `/log-better`
Structured logging standards for development and debugging. Defines prefix conventions (`[emulator]`, `[api]`, `[workflow:step:name]`), error templates, and async operation patterns.

### `/vercel-workflow-devkit`
Comprehensive guide to Vercel's Workflow Development Kit (WDK) for building durable, long-running workflows. Covers all foundations: workflows/steps, starting workflows, control flow, errors/retrying, hooks/webhooks, streaming, serialization, and idempotency.

Source: [useworkflow.dev](https://useworkflow.dev)

## Usage

### For AI Assistants
These files serve as reference material during code generation and review. When working on:
- **React components**: Reference `/react-best-practices/SKILL.md`
- **UI/UX decisions**: Reference `/web-design-guidelines/SKILL.md`
- **Major architectural decisions**: Follow `/council-process/README.md`

### For Human Developers
Review these guidelines before:
- Creating new components
- Implementing data fetching patterns
- Designing user interfaces
- Making infrastructure decisions

## Keeping Up to Date

These guidelines are sourced from Vercel's official repositories. To update:

```bash
# Install skills CLI
npm install -g @anthropic-ai/skills

# Update react-best-practices
npx skills add vercel-labs/agent-skills --skill react-best-practices

# Update web-design-guidelines
npx skills add vercel-labs/agent-skills --skill web-design-guidelines
```

Or manually fetch the latest from:
- https://github.com/vercel-labs/agent-skills
- https://github.com/vercel-labs/web-interface-guidelines
