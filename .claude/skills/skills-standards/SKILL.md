---
name: skills-standards
description: Standards for authoring SDD plugin skills — frontmatter, self-containment, and input/output schemas.
---

# Skills Standards

Standards for every skill in `plugin/skills/`. Apply when creating or reviewing plugin skills.

---

## Scope

This standard applies to skills shipped with the SDD plugin — all `SKILL.md` files found recursively under `plugin/skills/`. It does not apply to the repo's own `.claude/skills/`.

---

## Frontmatter

Every `SKILL.md` must start with YAML frontmatter containing exactly these fields:

```yaml
---
name: my-skill              # REQUIRED — kebab-case, must match directory name
description: >              # REQUIRED — what it does + what it needs/produces
  Discover required technical components through targeted questions
  based on classified requirements. Accepts classified requirements
  and produces a component list with types, names, and rationale.
user-invocable: false        # REQUIRED — true only for skills the user triggers via /command
---
```

| Field | Type | Rule |
|-------|------|------|
| `name` | `string` | kebab-case, matches parent directory name |
| `description` | `string` | 1-3 sentences. First sentence: what the skill does. Remaining sentences (optional): what it accepts/produces, key constraints, or disambiguation from similar skills. Never reference where or when the skill is used — the skill doesn't know its callers. The model uses this to decide whether to load the skill, so include enough signal for accurate selection. |
| `user-invocable` | `boolean` | `true` if the user invokes it via `/skill-name`; `false` for internal skills invoked by the plugin workflow or other skills |

**No other frontmatter fields.** Additional metadata belongs in the skill body.

---

## Self-Containment

The less a skill assumes about its environment, the more portable, reusable, and maintainable it is. A skill that depends on implicit knowledge from other skills is fragile — renaming, restructuring, or removing a dependency silently breaks it. A self-contained skill can be moved, composed differently, or understood in isolation.

Each skill must be fully understandable on its own. An LLM reading a single skill should never need to read another skill to understand what this skill requires it to do.

### Rules

1. **Delegate clearly** — When referencing another skill, state what you expect it to do (the contract), not how it works internally. The reader should understand the *role* of the delegated skill without reading it.
2. **Don't duplicate** — Never copy definitions, patterns, or rules from another skill into yours. Duplication creates drift and bloats skills with out-of-context information. If a concept is owned by another skill, delegate to it.
3. **No environment assumptions** — Do not assume a specific directory structure, tool version, or runtime context unless the skill explicitly documents it. If the skill requires a file to exist or a tool to be available, state that as a precondition.
4. **Define your own terms** — If the skill introduces domain-specific vocabulary, define it on first use. Don't define terms that belong to other skills — delegate instead.
5. **Complete examples** — Every example must be understandable without external context. Include the data shapes, field names, and structure needed to make the example self-contained.

### Cross-references

A skill references another skill by describing what it expects from it — the delegation contract. This is the only form of cross-reference needed.

### BAD

```markdown
## Backend Generation
Follow the `backend-scaffolding` skill for CMDO structure.
```

The reader doesn't know what `backend-scaffolding` will produce or what role it plays in this skill's workflow.

### ALSO BAD

```markdown
## Backend Generation
Generate backend components using the CMDO pattern (Config, Model, DAL, Operator)
with a Controller entry point. Each layer is a separate file under `src/`:
- `config.ts` — typed environment configuration
- `model.ts` — domain types (readonly, no classes)
...
```

Now the skill duplicates the entire CMDO definition from `backend-scaffolding`. When that pattern changes, this copy drifts silently.

### GOOD

```markdown
## Backend Generation
Delegate to the `backend-scaffolding` skill to generate the server component
directory structure and source files. It expects a component name and server
settings from `sdd-settings.yaml`, and produces a ready-to-build `src/` tree.
```

The reader knows what to pass in, what comes out, and where the responsibility lives — without needing to read `backend-scaffolding` or duplicating its internals.

---

## Input / Output Schema

Every skill that accepts parameters or produces structured output must define them as colocated JSON Schema files. This keeps schemas machine-readable, validatable, and composable — the output schema of one skill can be validated against the input schema of the next.

### File layout

```text
plugin/skills/my-skill/
├── SKILL.md
├── input.schema.json       # What this skill accepts
└── output.schema.json      # What this skill produces
```

Schema files live alongside `SKILL.md` in the skill's directory. The `SKILL.md` references them but does not duplicate their contents.

### Schema file format

Use JSON Schema Draft 2020-12. Example `input.schema.json`:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "my-skill input",
  "description": "Parameters for the skill.",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Identifier for the item to process"
    },
    "mode": {
      "type": "string",
      "enum": ["full", "partial", "dry-run"],
      "description": "Processing mode"
    },
    "tags": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Optional labels to attach"
    }
  },
  "required": ["name", "mode"]
}
```

Example `output.schema.json`:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "my-skill output",
  "description": "Result of processing.",
  "type": "object",
  "properties": {
    "items": {
      "type": "array",
      "description": "Processed items with their outcomes",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "description": "Generated identifier"
          },
          "status": {
            "type": "string",
            "enum": ["created", "skipped", "failed"],
            "description": "Outcome for this item"
          }
        },
        "required": ["id", "status"]
      }
    }
  },
  "required": ["items"]
}
```

### Referencing schemas in SKILL.md

The `## Input` and `## Output` sections in `SKILL.md` should reference the schema files and provide a brief human-readable summary — not duplicate the full schema:

```markdown
## Input

Schema: [`input.schema.json`](./input.schema.json)

Accepts an item name, processing mode, and optional tags.

## Output

Schema: [`output.schema.json`](./output.schema.json)

Returns a list of processed items, each with an id and a status (created, skipped, or failed).
```

### Schema rules

- Use JSON Schema Draft 2020-12 (`$schema` field required)
- Include `title` and `description` at the root level
- Every property must have a `description`
- Use `enum` for fixed option sets
- Use `required` to mark mandatory fields
- Nest `items` for array properties
- Keep schemas minimal — only document what the skill actually consumes or produces

### When schemas are not needed

Skills that define standards or guidelines (rather than accepting parameters or producing structured output) need no schema files. Note this in `SKILL.md`:

```markdown
## Input / Output

This skill defines no input parameters or structured output.
```

---

## Skill Structure

After the frontmatter, organize the skill body as follows:

```
# Skill Title                  <- H1, matches `name` in title-case
One-line summary paragraph.    <- What this skill does, when to apply it
---
## Input                       <- (if applicable) JSON Schema
## Output                      <- (if applicable) JSON Schema
## <Core Sections>             <- H2 sections with the skill's rules/workflow
## Examples                    <- (recommended) Concrete usage examples
```

### Writing rules

- **Headings** — H1 for the title, H2 for major sections, H3 for subsections. No deeper.
- **Code blocks** — Always specify language (`json`, `typescript`, `bash`, `yaml`, `markdown`).
- **Tables** — Use for comparisons, quick-reference, and field definitions.
- **Good/Bad examples** — When showing anti-patterns, label clearly with `BAD` / `GOOD` headings.
- **Rationale** — Explain *why* a rule exists, not just *what* it says. Rules without rationale get ignored.

---

## Checklist

Use when creating or reviewing a plugin skill:

- [ ] Frontmatter has exactly `name`, `description`, and `user-invocable`
- [ ] `name` is kebab-case and matches the directory name
- [ ] `description` is 1-3 sentences: what the skill does + what it accepts/produces. No references to callers or workflow position.
- [ ] `user-invocable` is explicitly `true` or `false`
- [ ] Cross-references describe the delegation contract (what goes in, what comes out, where responsibility lives)
- [ ] No duplicated definitions — concepts owned by other skills are delegated, not copied
- [ ] No undocumented environment assumptions (directory structure, CLI tools, runtime)
- [ ] Domain terms introduced by this skill are defined on first use
- [ ] All examples are self-contained
- [ ] `input.schema.json` / `output.schema.json` colocated (or `## Input / Output` notes "no input/output")
- [ ] JSON Schemas use Draft 2020-12 and include `description` on each property
- [ ] Code blocks specify language

## Input / Output

This skill defines no input parameters or structured output.

---

## Audit Procedure

Run this audit against all plugin skills to produce a fresh violations report. Recursively find every `SKILL.md` under `plugin/skills/`, then check each skill against the categories below.

### What to check per skill

For each `SKILL.md`, check every item in the **Checklist** section above. Additionally:

1. **Dependency graph** — Build a directed graph of skill-to-skill delegation references across all skills. Flag any circular references (A delegates to B, B delegates to A) or longer cycles.
2. **Self-containment quotes** — When flagging vague cross-references, quote the problematic text directly so the violation is actionable.

### Report format

Produce the report with these sections:

```markdown
# Skills Standards Audit — YYYY-MM-DD

## Summary

| Category | Passing | Failing | Total |
|----------|---------|---------|-------|
| Frontmatter | X | Y | Z |
| Self-containment | ... | ... | ... |
| Dependency graph | ... | ... | ... |
| Term definitions | ... | ... | ... |
| Input/Output schemas | ... | ... | ... |
| Code blocks | ... | ... | ... |
| Environment preconditions | ... | ... | ... |

## Dependency Graph
<!-- Directed graph of skill-to-skill delegations. Flag cycles. -->
<!--
  scaffolding -> backend-scaffolding
  scaffolding -> frontend-scaffolding
  ...
  Cycles: none | A -> B -> A
-->

## Systemic Violations
<!-- Issues affecting 5+ skills — address as bulk fixes -->

## Per-Skill Violations
<!-- One subsection per failing skill, with quoted violations -->

## Recommended Fix Priority
<!-- Ordered by impact and effort -->
```

### Report output location

**Never write audit reports inside `plugin/skills/`.** The plugin folder is for shipped skill files only — no reports, scratch files, or artifacts.

Write the report to a task in `.tasks/` (create one via `/tasks add`). Save it as `report.md` inside the task folder:

```
.tasks/1-inbox/<N>/
├── task.md        # Task with key findings summary
└── report.md      # Full audit report
```

### How to run

Ask: "Audit all plugin skills against the skills-standards skill and produce a violations report."

Run the audit directly (do not delegate to subagents):

1. Glob for all `plugin/skills/**/SKILL.md` files
2. Read each file completely
3. Check every item from the Checklist above, plus the additional audit-specific checks
4. Create a task via `/tasks add` and write the report as `report.md` in the task folder
