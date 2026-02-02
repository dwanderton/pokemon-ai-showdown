# Todo Management Skill

## Overview

Guidelines for tracking pending tasks and questions throughout a project session. Todos are stored in `/todos/pending.md` and deleted only after user confirmation of completion.

## Documentation

- Internal convention for v0 project management

## Directory Structure

```
/todos/
  pending.md    # Current active todos and questions
```

## Pending.md Format

```markdown
# Pending Todos

Last Updated: 2026-01-22 19:00 UTC

## Questions for User

- [ ] Question 1 that needs clarification?
- [ ] Question 2 about implementation choice?

## In Progress

- [ ] Task currently being worked on
  - Sub-detail or blocker

## Queued

- [ ] Next task to work on
- [ ] Another queued task

## Blocked

- [ ] Task blocked by external dependency
  - Reason: waiting for X

## Completed (Pending Confirmation)

- [x] Task completed but awaiting user verification
- [x] Another completed task
```

## Rules

1. **Create `/todos/pending.md` at session start** when multiple tasks are identified
2. **Update after each task completion** - move to "Completed (Pending Confirmation)"
3. **Ask user for confirmation** before deleting completed items
4. **Delete the file** only when user confirms all tasks are satisfactory
5. **Questions go at the top** - user questions should be visible first
6. **Include timestamps** - Last Updated should reflect most recent change
7. **Be specific** - Each todo should be actionable and clear
8. **Track blockers** - Note why tasks are blocked

## Workflow

```
1. User provides multiple tasks
   └─> Create /todos/pending.md with all tasks

2. Work on task
   └─> Update "In Progress" section

3. Complete task
   └─> Move to "Completed (Pending Confirmation)"
   └─> Update "Last Updated" timestamp

4. All tasks done
   └─> Ask user: "I've completed all tasks. Please review and confirm."

5. User confirms satisfaction
   └─> Delete /todos/pending.md
```

## Example Session

```markdown
# Pending Todos

Last Updated: 2026-01-22 19:15 UTC

## Questions for User

- [ ] Should the button be primary or secondary style?

## In Progress

- [ ] Fix emulator input not being received
  - Investigating canvas capture method

## Queued

- [ ] Add timestamp to thoughts panel
- [ ] Fix volume unmute level

## Completed (Pending Confirmation)

- [x] Create todo-management skill
- [x] Create emulator-js skill
```

## Common Mistakes

- Creating todos for single-task requests (unnecessary)
- Not updating the file after completing work
- Deleting todos without user confirmation
- Putting questions at the bottom where they're missed
- Vague todos like "fix bugs" instead of specific issues
