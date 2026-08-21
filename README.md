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
| **Lab Notebook** (standalone) | `npx skills add chroline/oliver/skills/lab-notebook` | [Lab Notebook README](./skills/lab-notebook/README.md) |

## Install a suite

Run this when you only want OliverSpec:

```bash
npx skills add chroline/oliver/skills/oliverspec
```

Run these when you want Factory's single-ticket pipeline and its automatic PR follow-through:

```bash
npx skills add chroline/oliver/skills/factory
npx skills add chroline/oliver/skills/babysit
```

Run this when PRs already exist and you only need CI/review fixes through merge:

```bash
npx skills add chroline/oliver/skills/babysit
```

Run this to keep experimental evidence and current understanding in one Markdown file:

```bash
npx skills add chroline/oliver/skills/lab-notebook
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
  lab-notebook/        ← standalone: npx skills add chroline/oliver/skills/lab-notebook
    README.md
    SKILL.md
```
