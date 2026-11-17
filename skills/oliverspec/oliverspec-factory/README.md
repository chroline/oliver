# OliverSpec Factory

Autonomous software factory for **one Linear ticket or one request**. You answer every design question up front; agents plan, critique, implement, review, open the PR, get CI green, and merge.

Where the rest of OliverSpec runs a whole project (explore → propose → scope → apply → babysit → ship), Factory collapses that into one run for one unit of work.

```mermaid
flowchart LR
  req[ticket / request] --> questions[ask human] --> plan
  plan <--> pcrit[plan critique vs requirements]
  pcrit --> implement
  implement <--> icrit[impl critique vs acceptance criteria]
  icrit --> review[code review loop] --> pr[open PR]
  pr <--> ci[CI: fix until green]
  ci --> merge
```

## Install

```bash
npx skills add chroline/oliver/skills/oliverspec
```

## What it does

1. Loads the Linear ticket (or takes your request) and reads the repo's agent instructions
2. Asks you **every** open question at once; you make all design decisions
3. Planner (Opus or Sol, else the smartest model) writes a concise `plan.md`
4. A fresh critic checks the plan against the original requirements; loop until approved
5. Posts the plan on the ticket
6. Implementer (Sonnet or Terra, else the smartest model) builds it test-first in a worktree and proves it end to end (`proof/e2e.md`; screenshots or a recording for UI)
7. A critic on the implementer's model checks the implementation against the original acceptance criteria (ticket or your message) and the plan's criteria; loop until approved
8. Runs the repo's code review process (or a code-review agent) until there are no blockers
9. Opens a ready (non-draft) PR, waits for CI, fixes failures until green
10. Merges and moves the ticket to Done

## What you need

- **GitHub CLI (`gh`)**
- **Linear MCP** when working from a ticket

## Related

- Full project workflow: [OliverSpec](../README.md)
