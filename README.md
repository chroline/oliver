# Oliver

Personal agent skill suite — workflows Cole uses across projects.

Discoverable via [skills.sh](https://skills.sh/chroline/oliver) / [vercel-labs/skills](https://github.com/vercel-labs/skills).

## Suites

| Suite | Install | Docs |
|-------|---------|------|
| **OliverSpec** | `npx skills add chroline/oliver/skills/oliverspec` | [README](./skills/oliverspec/README.md) |

## Install

**One suite** (preferred as the repo grows):

```bash
npx skills add chroline/oliver/skills/oliverspec
```

**Everything in this repo:**

```bash
npx skills add chroline/oliver
# or non-interactive:
npx skills add chroline/oliver --all -y
```

Browse: https://skills.sh/chroline/oliver

## Layout

Suites live under `skills/<suite>/<skill>/SKILL.md` so each suite installs via a GitHub subpath without pulling every skill in the monorepo.

```
skills/
  oliverspec/          ← npx skills add chroline/oliver/skills/oliverspec
    README.md
    oliverspec-explore/
    oliverspec-propose/
    oliverspec-scope/
    oliverspec-apply/
    oliverspec-babysit/
  # future suites…
```
