# Council Review Process

## Overview

The council review process is a structured approach to validating major architectural and design decisions through multiple expert perspectives. Reviews are stored in the `/council` directory with timestamps for historical reference.

## When to Invoke the Council

Invoke a council review when:

1. **Major architectural decisions** - Database schema, API design, state management approach
2. **Technology stack changes** - Adding new dependencies, switching providers
3. **Design system updates** - New component patterns, visual language changes
4. **Performance trade-offs** - Caching strategies, optimization approaches
5. **Cost implications** - AI model selection, infrastructure scaling

## Council Members

### 1. Product Engineer Review
**Focus:** Code quality, maintainability, performance optimization

Questions they answer:
- Where can code optimizations be made?
- Are we following DRY principles?
- Is the code testable and maintainable?
- Are there potential performance bottlenecks?
- Do we have proper error handling and recovery?

### 2. CTO Review
**Focus:** Infrastructure, cost, scalability, technology showcase

Questions they answer:
- Are we using the most appropriate infrastructure?
- What are the cost risks and how do we mitigate them?
- Are we showcasing new Vercel/Next.js features effectively?
- Is the architecture scalable?
- Do we have proper observability?

### 3. Designer Review (basement.studio perspective)
**Focus:** Visual storytelling, user experience, brand alignment

Questions they answer:
- Does the design tell a compelling story?
- Are we following Vercel's design ethos?
- Is the experience engaging and memorable?
- Are interactions delightful and purposeful?
- Does the visual hierarchy guide users effectively?

## Review Output Format

Each review should produce:

1. **Summary** - 2-3 sentence overview of key findings
2. **Critical Issues** - Must-fix before proceeding
3. **Recommendations** - Should-consider improvements
4. **Opportunities** - Nice-to-have enhancements
5. **Questions** - Items needing clarification

## Incorporating Feedback

After reviews are complete:

1. Distill actionable items from all three perspectives
2. Prioritize by impact and alignment with project goals
3. Update specifications with accepted recommendations
4. Document rejected recommendations with rationale
5. Increment specification version

## File Naming Convention

```
/council/
  YYYY-MM-DD HHMM <review-name>/
    product-engineer-review.md
    cto-review.md
    designer-review.md
```

Example: `/council/2026-01-22 1510 specification review/`

## Example Council Invocation

```
Please conduct council reviews of the current specifications:

1. Product Engineer Review: Focus on code optimizations and maintainability
2. CTO Review: Focus on infrastructure choices and cost analysis
3. Designer Review: Focus on visual storytelling and user experience

Save reviews to /council/YYYY-MM-DD HHMM <topic>/
```
