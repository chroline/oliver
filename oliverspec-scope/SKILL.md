---
name: oliverspec-scope
description: >
  Scope an OliverSpec PRD + TRD into Linear tickets with clear descriptions,
  acceptance criteria, and explicit blockedBy/blocks relations. Use after
  oliverspec-propose when the user wants to scope, /oliverspec scope, or
  oliverspec-scope. Does not write proposal docs to the git repo.
license: MIT
metadata:
  author: oliverspec
  version: "1.0"
---

**Scope** an OliverSpec **PRD + TRD** into Linear **tickets**. Never write proposal markdown into the git repo.

**Prerequisite:** a Linear project with PRD and TRD documents (from `oliverspec-propose`). If missing, stop and tell the user to run `oliverspec-propose` first.

When scoped tickets are ready, run `oliverspec-apply`.

---

## Defaults

| Setting | Default |
|---------|---------|
| Linear team | **Engineering** (override only if user specifies another team) |
| Source of truth | Project **PRD** + **TRD** Linear documents |
| PR stacking later | Graphite — slice tickets to be stack-friendly |

---

## Input

- Linear **project name** (or infer from conversation)
- Optional: constraints on ticket size / sequencing

Announce: `Scoping OliverSpec project: <name>`.

---

## Steps

### 1. Load PRD + TRD

1. Read Linear MCP tool schemas before calling tools
2. Resolve the project (`list_projects` / `get_project`)
3. `list_documents` + `get_document` for the PRD and TRD
4. If either document is missing or too thin to slice, stop — send the user back to `oliverspec-propose`

### 2. Draft the scoped ticket breakdown (in chat first)

From the PRD (**product** what/why) and TRD (**deeply technical** how), draft and show:

1. **Numbered ticket list** — title, scope summary, ordering rationale (cite PRD/TRD sections)
2. **Mermaid dependency graph** of tickets (flowchart — never ASCII)
3. **Acceptance criteria preview** per ticket (checkboxes)

Principles for slicing:

- Each ticket is independently reviewable as its own Graphite-stacked PR
- Order by dependency — schema before logic, backend before frontend
- **"Flip the switch" last** — enforcement/gating after supporting flow
- Parallel where possible — call out tickets that don't block each other
- Every ticket gets **testable acceptance criteria**
- **Stack-friendly slices** — `oliverspec-apply` opens one Graphite PR per ticket; avoid grab-bag tickets that fight restacks
- Prefer TRD section boundaries as natural ticket seams when they map cleanly

**Ask the user to confirm before creating anything in Linear.**

### 3. Create tickets

For each confirmed ticket, `save_issue`:

- `team`: Engineering (or override)
- `project`: the project name/id
- `title`: concise, implementation-oriented
- `description`: use the ticket template below
- `priority`: set when obvious; otherwise omit

#### Ticket template

```markdown
## Context
<Why this ticket exists; link PRD + TRD themes/sections>

## Scope
- <concrete sub-deliverable>
- <...>

## Acceptance Criteria
- [ ] <observable, testable outcome>
- [ ] <...>
- [ ] <tests / verification expectation if relevant>

## Dependencies
<!-- Documentary only — you MUST also set Linear blockedBy/blocks relations -->
- Blocked by: <ticket titles or ids>
- Blocks: <...>

## Notes
<edge cases, out of scope for this ticket, implementation hints from TRD>
```

### 4. Wire Linear relations (required)

**Critical:** After create, every dependency edge must be applied with `save_issue` `blockedBy` and/or `blocks`. Mentioning blockers only in the description is not enough.

1. Set `blockedBy` / `blocks` via `save_issue` updates using issue identifiers
2. Description `## Dependencies` is documentation only; native relations are the source of truth for apply waves
3. Verify each planned edge (`get_issue` with `includeRelations: true` if needed)
4. Optionally update the PRD/TRD with a **Ticket index** table (IDs, titles, depends-on, links)

**Incomplete without relations:** If the Mermaid graph or description implies edges missing from Linear relations, this skill is not done — fix relations before handoff.

### 5. Done — hand off

Summarize:

- Project + PRD + TRD links
- Ticket table: ID, title, blocked by, blocks, URL
- Prompt: "Run `oliverspec-apply` (optionally with the project name) to implement — parallel sub-agents and one Graphite-stacked PR per ticket."

---

## Guardrails

- **Read PRD + TRD first** — don't invent scope that isn't grounded in those docs
- **No repo proposal artifacts**
- **Confirm breakdown before creating** issues
- **Default team Engineering**
- **Diagrams in Mermaid only**
- **Every ticket must have acceptance criteria** as checkboxes
- **Explicit Linear blockers required** — `blockedBy` / `blocks` on every dependency edge
- **Do not rewrite the PRD/TRD** except optional ticket index / links — design changes go back to `oliverspec-propose`
- Do not start implementation in this skill
