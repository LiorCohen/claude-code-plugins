# Check Tools Skill

Verify that required and optional tools are installed before running SDD commands.

## Purpose

Commands invoke this skill at startup to verify dependencies are available. This prevents mid-workflow failures when a required tool is missing.

## Input

The calling command specifies which tools to check:

```yaml
required: [node, npm, git, docker]  # Fail if any missing
optional: [jq, kubectl, helm]       # Warn if missing
```

## Output Format

Display tool status with versions:

```
Checking required tools...

  ✓ node (v20.10.0)
  ✓ npm (v10.2.3)
  ✓ git (v2.42.0)
  ✓ docker (v24.0.6)

Checking optional tools...

  ⚠ jq not found (needed for hooks)
  ✓ kubectl (v1.28.0)
  ⚠ helm not found (needed for Kubernetes charts)

Optional tools missing - some features may be limited.
```

If required tools are missing:

```
Checking required tools...

  ✓ node (v20.10.0)
  ✗ npm not found
  ✓ git (v2.42.0)
  ✗ docker not found

ERROR: Required tools missing. Install them before continuing:

  npm: Install Node.js from https://nodejs.org/
  docker: Install Docker Desktop from https://www.docker.com/products/docker-desktop
```

## Version Detection Commands

| Tool | Command | Version Extraction |
|------|---------|-------------------|
| node | `node --version` | Output directly (e.g., "v20.10.0") |
| npm | `npm --version` | Output directly (e.g., "10.2.3") |
| git | `git --version` | Parse "git version X.Y.Z" |
| docker | `docker --version` | Parse "Docker version X.Y.Z" |
| jq | `jq --version` | Output directly (e.g., "jq-1.6") |
| kubectl | `kubectl version --client -o json` | Parse JSON `.clientVersion.gitVersion` |
| helm | `helm version --short` | Output directly (e.g., "v3.12.0") |

## Error Handling

- If command returns non-zero exit code → tool not installed
- If command times out (>5s) → treat as not installed
- Report all missing tools at once (don't fail on first)

## Tool Requirements by Command

| Command | Required | Optional |
|---------|----------|----------|
| `/sdd-init` | node, npm, git, docker | jq, kubectl, helm |
| `/sdd-change new` | node, npm, git | - |
| `/sdd-change implement` | node, npm, git | - |
| `/sdd-change verify` | node, npm, git | - |
| `/sdd-local-env start` | docker | kubectl, helm |

## Installation Instructions

When tools are missing, provide platform-appropriate installation instructions:

### node / npm
```
Install Node.js from https://nodejs.org/ (includes npm)
Or via Homebrew: brew install node
```

### git
```
macOS: brew install git
Ubuntu: apt-get install git
```

### docker
```
Install Docker Desktop from https://www.docker.com/products/docker-desktop
```

### jq
```
macOS: brew install jq
Ubuntu: apt-get install jq
```

### kubectl
```
macOS: brew install kubectl
Ubuntu: snap install kubectl --classic
```

### helm
```
macOS: brew install helm
Ubuntu: snap install helm --classic
```

## Usage in Commands

Commands invoke this skill at the start of execution:

```markdown
## Phase 0: Environment Check

Invoke the `check-tools` skill with:
- required: [node, npm, git, docker]
- optional: [jq, kubectl, helm]

If required tools are missing, display error and exit.
If optional tools are missing, display warning and continue.
```
