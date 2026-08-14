# Factory

Standalone skill: autonomous software factory for **one Linear ticket**. Plan → blind critique → implement → stacked PRs → babysit → merge on your green-light.

Where OliverSpec is a full project suite (explore → propose → scope → apply → babysit → ship), Factory is a single skill that collapses that into one ticket run.

```mermaid
flowchart LR
  ticket --> plan --> critique --> implement --> prs --> babysit --> greelight[green-light] --> merge
```

## Install

```bash
npx skills add chroline/oliver/skills/factory
```

## What it does

1. Loads a Linear ticket
2. Smart-model **plan** → `/tmp/factory/<ISSUE-ID>/plan.md` (mermaid where useful)
3. Different smart-model **blind-critiques** the plan; revise until settled (max 3 rounds)
4. Comments the full plan on the ticket
5. Implementer sub-agent (best Grok, else Sonnet / GPT terra) lands the work via TDD and **proves it end-to-end** (`proof/e2e.md`) before any PR
6. Size gate: ≥1500 filtered lines (minus migrations/snapshots) must be justified **in the PR description** or split into `gh stack` PRs
7. Opens **ready** (non-draft) PRs only — never babysit drafts; mark ready before watching CI
8. Frontend: Storybook verification; **screenshots or screen recording** in the PR body **and** uploaded on a Linear comment (not GitHub links)
9. Babysits CI + review until the stack is mergeable
10. **Stops and notifies you** — merges only after your green-light

## What you need

- **Linear MCP**
- **GitHub CLI (`gh`) 2.90.0+** with `gh extension install github/gh-stack`
- Stacked PRs enabled on the repo (or Factory falls back to chained plain PRs)

## Related

- Full project workflow: [OliverSpec](../oliverspec/README.md)
