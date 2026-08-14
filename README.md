# Oliver

My personal agent skill suite for workflows I reuse across projects. Install individual suites from this repo through the skills CLI, or install everything at once.

Discoverable on [skills.sh](https://skills.sh/chroline/oliver) via [vercel-labs/skills](https://github.com/vercel-labs/skills).

## Suites in this repo

I group skills into suites (or standalone skills) so you can install one workflow without pulling the rest:

| Package | Install | Docs |
|---------|---------|------|
| **OliverSpec** (suite) | `npx skills add chroline/oliver/skills/oliverspec` | [OliverSpec README](./skills/oliverspec/README.md) |
| **Factory** (standalone) | `npx skills add chroline/oliver/skills/factory` | [Factory README](./skills/factory/README.md) |
| **Babysit** (standalone) | `npx skills add chroline/oliver/skills/babysit` | [Babysit README](./skills/babysit/README.md) |

## Install a suite

Run this when you only want OliverSpec:

```bash
npx skills add chroline/oliver/skills/oliverspec
```

Run this when you only want Factory (single-ticket autonomous pipeline):

```bash
npx skills add chroline/oliver/skills/factory
```

Run this when you only want Babysit (watch open PRs / stacks):

```bash
npx skills add chroline/oliver/skills/babysit
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

Suites live under `skills/<suite>/<skill>/SKILL.md`. Standalone skills live under `skills/<skill>/SKILL.md`. Those subpaths are what the skills CLI uses to install one package without the others:

```text
skills/
  oliverspec/          ← suite: npx skills add chroline/oliver/skills/oliverspec
    README.md
    oliverspec-explore/
    oliverspec-propose/
    oliverspec-scope/
    oliverspec-apply/
    oliverspec-babysit/
    oliverspec-ship/
  factory/             ← standalone: npx skills add chroline/oliver/skills/factory
    README.md
    SKILL.md
  babysit/             ← standalone: npx skills add chroline/oliver/skills/babysit
    README.md
    SKILL.md
```
