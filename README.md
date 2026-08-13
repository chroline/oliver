# Oliver

My personal agent skill suite for workflows I reuse across projects. Install individual suites from this repo through the skills CLI, or install everything at once.

Discoverable on [skills.sh](https://skills.sh/chroline/oliver) via [vercel-labs/skills](https://github.com/vercel-labs/skills).

## Suites in this repo

I group skills into suites so you can install one workflow without pulling the rest:

| Suite | Install | Docs |
|-------|---------|------|
| **OliverSpec** | `npx skills add chroline/oliver/skills/oliverspec` | [OliverSpec README](./skills/oliverspec/README.md) |

## Install a suite

Run this when you only want OliverSpec:

```bash
npx skills add chroline/oliver/skills/oliverspec
```

## Install every skill

Run this when you want the full Oliver suite:

```bash
npx skills add chroline/oliver
```

Skip prompts with:

```bash
npx skills add chroline/oliver --all -y
```

Browse the package on [skills.sh/chroline/oliver](https://skills.sh/chroline/oliver).

## How the repo is laid out

Suites live under `skills/<suite>/<skill>/SKILL.md`. That subpath is what the skills CLI uses to install one suite without the others:

```text
skills/
  oliverspec/          ← npx skills add chroline/oliver/skills/oliverspec
    README.md
    oliverspec-explore/
    oliverspec-propose/
    oliverspec-scope/
    oliverspec-apply/
    oliverspec-babysit/
    oliverspec-ship/
  # future suites…
```
