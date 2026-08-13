---
name: oliverspec-scope
description: >
  Scope an OliverSpec PRD + TRD into Linear tickets with clear descriptions,
  acceptance criteria, and explicit blockedBy/blocks relations. Use after
  oliverspec-propose when the user wants to scope, /oliverspec scope, or
  oliverspec-scope. Does not write proposal docs to the git repo.
license: MIT
metadata:
  author: chroline
  version: "1.2"
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
| PR stacking later | GitHub stacked PRs (`gh stack`) — slice tickets to be stack-friendly |

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

- Each ticket is independently reviewable as its own stacked PR
- Order by dependency — schema before logic, backend before frontend
- **"Flip the switch" last** — enforcement/gating after supporting flow
- Parallel where possible — call out tickets that don't block each other
- Every ticket gets **testable acceptance criteria**
- **TDD by default** — tickets are implemented with test-driven development in `oliverspec-apply`. Scope each ticket so acceptance criteria demand **comprehensive tests** for a full implementation (happy path, edge cases, failure modes called out in the TRD). Thin “add a smoke test” ACs are not enough
- **Stack-friendly slices** — `oliverspec-apply` opens one stacked PR per ticket; avoid grab-bag tickets that fight rebases
- **Prefer chains over diamonds** — a GitHub stack is a strictly linear chain, so a ticket with two independent `blockedBy` parents can only sit under one of them. Wire relations as chains where the real dependency allows it, and only use a second parent when the ticket genuinely needs both
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
- [ ] <observable, testable product/behavior outcome>
- [ ] <...>
- [ ] Tests first (TDD): comprehensive failing tests for the behavior above
- [ ] Typecheck stays green via stubs/fakes/interfaces while those tests are still red
- [ ] Full implementation replaces stubs until tests pass
- [ ] Relevant typecheck/lint/test commands pass for this ticket’s surface

## Dependencies
<!-- Documentary only — you MUST also set Linear blockedBy/blocks relations -->
- Blocked by: <ticket titles or ids>
- Blocks: <...>

## Notes
<edge cases, out of scope for this ticket, implementation hints from TRD>
```

Include concrete test expectations in ACs when the TRD names them (e.g. module, scenario, regression). Don’t leave testing as an optional afterthought.
### 4. Wire Linear relations (required)

**Critical:** After create, every dependency edge must be applied with `save_issue` `blockedBy` and/or `blocks`. Mentioning blockers only in the description is not enough.

1. Set `blockedBy` / `blocks` via `save_issue` updates using issue identifiers
2. Description `## Dependencies` is documentation only; native relations are the source of truth for apply waves
3. Verify each planned edge (`get_issue` with `includeRelations: true` if needed)
4. Optionally update the PRD/TRD with a **Ticket index** table (IDs, titles, depends-on, links)

**Incomplete without relations:** If the Mermaid graph or description implies edges missing from Linear relations, this skill is not done — fix relations before handoff.

### 5. Move project to Planned

After tickets are created (and relations wired), set the Linear project status to **Planned** (`save_project` with `id` = the project and `state: "Planned"`, or the team's equivalent planned-stage state if the name differs). Do **not** move it earlier — Backlog/idea status stays until the ticket set actually exists. This scope pass is what turns the project from an idea into a plan.

### 6. Done — hand off

Summarize:

- Project + PRD + TRD links
- Project status: **Planned**
- Ticket table: ID, title, blocked by, blocks, URL
- Prompt: "Run `oliverspec-apply` (optionally with the project name) to implement — parallel sub-agents and one stacked PR per ticket."

---

## Guardrails

- **Read PRD + TRD first** — don't invent scope that isn't grounded in those docs
- **Move the project to Planned after tickets are created** (`save_project` `state`) — not before; don't leave it in Backlog once the ticket set exists
- **No repo proposal artifacts**
- **Confirm breakdown before creating** issues
- **Default team Engineering**
- **Diagrams in Mermaid only**
- **Every ticket must have acceptance criteria** as checkboxes
- **TDD-ready tickets** — ACs must require comprehensive tests for a full implementation; apply will implement via TDD
- **Explicit Linear blockers required** — `blockedBy` / `blocks` on every dependency edge
- **Do not rewrite the PRD/TRD** except optional ticket index / links — design changes go back to `oliverspec-propose`
- Do not start implementation in this skill
