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
3. **No cross-skill file references** — Never reference or read files inside another skill's directory. A skill's internal files (templates, schemas, references) are private to that skill. If two skills need the same template or data, either consolidate them into one skill or extract the shared content into each skill's own directory. Cross-skill file references create hidden coupling that breaks when skills are moved, renamed, or restructured.
4. **No environment assumptions** — Do not assume a specific directory structure, tool version, or runtime context unless the skill explicitly documents it. If the skill requires a file to exist or a tool to be available, state that as a precondition.
5. **Define your own terms** — If the skill introduces domain-specific vocabulary, define it on first use. Don't define terms that belong to other skills — delegate instead.
6. **Complete examples** — Every example must be understandable without external context. Include the data shapes, field names, and structure needed to make the example self-contained.

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
└── schemas/
    ├── input.schema.json       # What this skill accepts
    └── output.schema.json      # What this skill produces
```

Schema files live in a `schemas/` subdirectory within the skill's directory. The `SKILL.md` references them but does not duplicate their contents.

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

Schema: [`schemas/input.schema.json`](./schemas/input.schema.json)

Accepts an item name, processing mode, and optional tags.

## Output

Schema: [`schemas/output.schema.json`](./schemas/output.schema.json)

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

## Layer Separation

Skills and the `sdd-system` CLI operate at different layers. Skills are prompt-layer artifacts — markdown documents consumed by commands and agents in the LLM context. The CLI is a system-layer tool that performs deterministic operations (file creation, validation, type generation, config merging).

**The CLI must never be aware of skills.** The invocation direction is one-way:

```text
Commands/Agents → Skills (prompt layer)
Commands/Agents → CLI (system layer)
Skills → CLI (skills may call CLI as a tool)
CLI ↛ Skills (NEVER — CLI must not route through or invoke skill definitions)
```

A skill may document calling the CLI (e.g., "run `sdd-system spec validate`"). A skill must never document being invoked by the CLI (e.g., "runs via `sdd-system scaffolding project`"). If the CLI has a subcommand that implements what a skill describes, the skill should be refactored so that the command or skill orchestrates CLI primitives — not the other way around.

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
- [ ] No cross-skill file references — never read or link to files inside another skill's directory
- [ ] No CLI-to-skill invocation — the skill is never invoked by the `sdd-system` CLI (skills may call the CLI, not the reverse)
- [ ] No undocumented environment assumptions (directory structure, CLI tools, runtime)
- [ ] Domain terms introduced by this skill are defined on first use
- [ ] All examples are self-contained
- [ ] `schemas/input.schema.json` / `schemas/output.schema.json` in skill subdirectory (or `## Input / Output` notes "no input/output")
- [ ] JSON Schemas use Draft 2020-12 and include `description` on each property
- [ ] Code blocks specify language

## Input / Output

This skill defines no input parameters or structured output.

---

## Skill Consumers Reference

Skills are consumed by two types of callers: **commands** (user-invocable slash commands) and **agents** (subagent implementations). This section is the authoritative mapping — update it when adding or removing skills, commands, or agents.

### Commands → Skills

| Command | Skills Invoked |
|---------|---------------|
| `/sdd-init` | `project-scaffolding` |
| `/sdd-change` | `workflow-state`, `component-discovery`, `spec-solicitation`, `spec-decomposition`, `external-spec-integration`, `planning` |
| `/sdd-config` | (none — uses `sdd-system` CLI; references `config-scaffolding`, `config-standards`, `helm-standards` for context) |
| `/sdd-settings` | (none — reads/writes `sdd-settings.yaml` directly) |
| `/sdd-run` | (none — wraps `sdd-system` CLI) |

### Agents → Skills

| Agent | Skills Used |
|-------|-------------|
| `backend-dev` | `typescript-standards`, `backend-standards`, `unit-testing`, `postgresql` |
| `frontend-dev` | `typescript-standards`, `frontend-standards`, `unit-testing` |
| `tester` | `integration-testing`, `e2e-testing` |
| `devops` | `postgresql` |
| `api-designer` | (none) |
| `reviewer` | (none) |
| `db-advisor` | (none) |
| `ci-dev` | (none) |

### Unreferenced Skills

Skills not directly referenced by any command or agent (used only by other skills or as standards context):

- `change-creation` — invoked by `planning` and `spec-decomposition` for epic handling
- `spec-writing` — consumed by `spec-solicitation` and `component-discovery`
- `domain-population` — invoked by `project-scaffolding` for initial domain spec creation
- `spec-index` — invoked by commands for spec indexing and validation
- `scaffolding` — invoked by `/sdd-init` for project creation
- `backend-scaffolding`, `frontend-scaffolding`, `contract-scaffolding`, `config-scaffolding`, `database-scaffolding`, `helm-scaffolding` — invoked by `scaffolding`
- `commit-standards` — referenced by `cicd-standards`
- `config-standards` — referenced by `helm-standards` and `database-standards`
- `contract-standards`, `database-standards`, `helm-standards`, `cicd-standards`, `testing-standards`, `local-env` — standards/reference skills loaded contextually

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
