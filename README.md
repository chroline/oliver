# Oliver

Personal agent skill suite — workflows Cole uses across projects.

Discoverable via [skills.sh](https://skills.sh/chroline/oliver) / [vercel-labs/skills](https://github.com/vercel-labs/skills).

## Install

**OliverSpec only** (recommended — installable as one suite):

```bash
npx skills add chroline/oliver/skills/oliverspec
```

**Everything in this repo** (as more suites are added):

```bash
npx skills add chroline/oliver
# or non-interactive:
npx skills add chroline/oliver --all -y
```

Browse: https://skills.sh/chroline/oliver

## Layout

Suites live under `skills/<suite>/<skill>/SKILL.md` so each suite can be installed via a GitHub subpath without pulling the whole monorepo of skills.

```
skills/
  oliverspec/          ← npx skills add chroline/oliver/skills/oliverspec
    oliverspec-explore/
    oliverspec-propose/
    oliverspec-scope/
    oliverspec-apply/
    oliverspec-babysit/
  # future suites…
```

## OliverSpec

Linear-backed explore → propose → scope → apply → babysit (OpenSpec-shaped, without repo-local change artifacts).

| Skill | Role |
|-------|------|
| [`oliverspec-explore`](./skills/oliverspec/oliverspec-explore/SKILL.md) | Think through a problem (no implementation) |
| [`oliverspec-propose`](./skills/oliverspec/oliverspec-propose/SKILL.md) | Write product **PRD** + deeply technical **TRD** as Linear docs |
| [`oliverspec-scope`](./skills/oliverspec/oliverspec-scope/SKILL.md) | Break PRD/TRD into Linear tickets with ACs + `blockedBy` |
| [`oliverspec-apply`](./skills/oliverspec/oliverspec-apply/SKILL.md) | Implement via parallel sub-agents; one Graphite-stacked PR per ticket |
| [`oliverspec-babysit`](./skills/oliverspec/oliverspec-babysit/SKILL.md) | Clear PR comments + CI across the stack (ignores Graphite mergeability) |

```mermaid
flowchart LR
  explore --> propose --> scope --> apply --> babysit
```

### Requirements

- [Linear MCP](https://linear.app) (propose / scope / apply / babysit)
- [Graphite CLI](https://graphite.dev) `gt` (apply / babysit stacks)
- GitHub CLI `gh` (PR inspection in babysit)
