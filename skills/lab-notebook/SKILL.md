---
name: lab-notebook
description: >
  Maintains a Markdown lab notebook for experiments, debugging, and operational
  investigations: keep current understanding in a concise summary and preserve
  meaningful work as append-only chronological entries. Use when the user says
  /lab-notebook, asks to start or update a lab notebook, or wants experimental
  work preserved for re-entry and auditability.
disable-model-invocation: true
license: MIT
metadata:
  author: chroline
  version: "1.0"
---

# Lab Notebook

Maintain one Markdown file as both a concise re-entry guide and a literal activity log.

Announce: `Lab Notebook: <path>`.

## Choose the file

1. Use the path supplied by the user.
2. Otherwise reuse the project's existing lab-notebook file or documented convention.
3. If none exists, create `lab-notebook.md` in the repository's established documentation or operations directory. Use the repository root only when no better location exists.
4. Read the entire file before appending or changing the summary.

Do not create multiple equally detailed notebooks for one investigation.

## File structure

Use this shape:

```markdown
# <Investigation name>

## Current target

<The concrete question or capability under investigation.>

## Current understanding

- <Only settled or currently best-supported beliefs.>

## Success criterion

<Observable condition that ends the investigation successfully.>

## Hypothesis registry

| Hypothesis | Strongest support | Strongest weakening evidence | Next falsifier         |
| ---------- | ----------------- | ---------------------------- | ---------------------- |
| <claim>    | <evidence>        | <counter-evidence>           | <discriminative check> |

## Next best check

<The single check with the highest information value.>

## Chronology
```

Keep the summary short enough for a fresh agent to re-enter without reading the full chronology.

## Record work

After each meaningful experiment, debugging step, probe, or job intervention, append one entry under `## Chronology`.

**Chronological entries are append-only.** Never edit, reorder, or delete an existing entry. Record corrections, reversals, and addenda as new entries that reference the earlier timestamp and title.

```markdown
### YYYY-MM-DD HH:mmZ — <short entry title>

**Question or goal**

<What this step was intended to learn or accomplish.>

**Action taken**

- <Exact commands, scripts, configuration, and environment boundaries.>

**Evidence**

- <Job, trace, commit, artifact, transcript, output, or file identifiers.>

**Result**

<What actually happened, including negative results.>

**Conclusion**

<Inference drawn from the result, if any.>

**Inference confidence:** low | medium | high

**Decision impact / so what?**

<What changed in current understanding or what should happen next.>
```

Rules:

- Preserve UTC chronology and exact identifiers.
- Record negative results when they eliminate a plausible path.
- Include confidence only when drawing an inference.
- Link or name reproducible scripts, fixtures, and artifacts instead of pasting large raw outputs.
- Never record credentials, secret values, private tokens, or sensitive payloads.
- Skip routine commands that produced no new evidence.

## Update the summary

After appending an entry, update the summary only when one of these changed:

- Current best explanation or baseline
- Settled negative result
- Success criterion or decision rule
- Live hypothesis support or falsifier
- Next best check

Do not copy chronological detail into the summary. The summary is mutable; the chronology is not.

## Completion criteria

The notebook is current when:

- The summary reflects the latest supported understanding.
- Every meaningful intervention has exactly one chronological entry.
- Corrections and addenda preserve the original record.
- Reproducible evidence paths resolve.
- No secret-bearing content is present.
