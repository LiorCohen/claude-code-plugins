---
name: scaffolding
description: Fast project scaffolding using Python script instead of file-by-file creation.
---

# Scaffolding Skill

Create project structure quickly using the Python scaffold script.

## When to Use

Use this skill when you need to create the SDD project structure after the user has approved the project configuration. This is much faster than creating files one by one with the Write tool.

## Usage

After gathering project configuration in `/sdd-init`, call the scaffold script:

```bash
# 1. Create a config JSON file
cat > /tmp/sdd-scaffold-config.json << 'EOF'
{
    "project_name": "<user-provided-name>",
    "project_description": "<user-provided-description>",
    "primary_domain": "<user-provided-domain>",
    "target_dir": "<absolute-path-to-project-directory>",
    "components": ["contract", "server", "webapp", "config", "testing", "cicd"],
    "template_dir": "<path-to-plugin>/templates"
}
EOF

# 2. Run the scaffold script
python3 <path-to-plugin>/skills/scaffolding/scaffolding.py --config /tmp/sdd-scaffold-config.json

# 3. Clean up config file
rm /tmp/sdd-scaffold-config.json
```

## Config Fields

| Field | Required | Description |
|-------|----------|-------------|
| `project_name` | Yes | Project name (used for variable substitution) |
| `project_description` | No | Brief description (defaults to "A {name} project") |
| `primary_domain` | No | Primary business domain (defaults to "General") |
| `target_dir` | Yes | Absolute path to create project in |
| `components` | Yes | List of components to create |
| `template_dir` | Yes | Path to the templates directory |

## Available Components

- `contract` - OpenAPI spec and type generation
- `server` - Node.js/TypeScript backend
- `webapp` - React/TypeScript frontend
- `config` - YAML configuration (always included)
- `helm` - Kubernetes deployment charts
- `testing` - Testkube test definitions
- `cicd` - GitHub Actions workflows

## Component Presets

**Full-Stack Application:**
```json
["contract", "server", "webapp", "config", "testing", "cicd"]
```

**Backend API Only:**
```json
["contract", "server", "config", "testing", "cicd"]
```

**Frontend Only:**
```json
["webapp", "config", "testing", "cicd"]
```

## Example

```bash
# Full-Stack project creation
cat > /tmp/sdd-scaffold-config.json << 'EOF'
{
    "project_name": "my-saas-app",
    "project_description": "A task management SaaS application",
    "primary_domain": "Task Management",
    "target_dir": "/Users/dev/projects/my-saas-app",
    "components": ["contract", "server", "webapp", "config", "testing", "cicd"],
    "template_dir": "/Users/dev/.claude-code/plugins/sdd/templates"
}
EOF

python3 /Users/dev/.claude-code/plugins/sdd/skills/scaffolding/scaffolding.py \
    --config /tmp/sdd-scaffold-config.json

rm /tmp/sdd-scaffold-config.json
```

## Output

The script outputs progress to stdout and returns exit code 0 on success:

```
Scaffolding project: my-saas-app
Target: /Users/dev/projects/my-saas-app
Components: config, contract, server, webapp, testing, cicd

Creating root files...
  Created: .gitignore

Creating directory structure...
  Created: specs/
  Created: specs/domain/
  ...

Copying template files...
  Created: README.md
  Created: CLAUDE.md
  Created: package.json
  ...

============================================================
Scaffolding complete!
============================================================
Created 25 directories
Created 42 files
Location: /Users/dev/projects/my-saas-app
```

## After Scaffolding

After the scaffold script completes, continue with:

1. **Initialize git** (if not already in a repo):
   ```bash
   cd <project-dir> && git init && git add . && git commit -m "Initial project setup"
   ```

2. **Verify structure** with `tree` command

3. **Display next steps** to the user

## Integration with sdd-init

The `/sdd-init` command should:

1. **Phases 1-3**: Gather information and get user approval (unchanged)
2. **Phase 4**: Instead of creating files one by one:
   - Determine the plugin directory path
   - Create the scaffold config JSON
   - Run the scaffold script via Bash
   - Initialize git
   - Verify and report

This reduces scaffolding time from ~5 minutes to ~5 seconds.
