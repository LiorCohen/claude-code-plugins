---
name: component-recommendation
description: Recommend and configure technical components based on product requirements.
---

# Component Recommendation Skill

Maps product requirements to technical architecture, recommending appropriate components and handling user adjustments.

## Purpose

Based on product discovery results:
- Recommend appropriate technical components
- Validate component dependencies
- Handle multiple component instances (e.g., multiple servers or webapps)
- Return final component configuration

## When to Use

- During `/sdd-init` after product discovery
- When adding new components to an existing project
- For architecture discussions

## Input

Receives discovery results from the `product-discovery` skill:

```yaml
discovery_results:
  product_description: "Task management for engineering teams"
  primary_domain: "Task Management"
  user_personas:
    - type: "Project Manager"
      actions: "create projects, assign tasks"
    - type: "Team Member"
      actions: "update progress"
  core_workflows:
    - "Create projects"
    - "Assign tasks"
  domain_entities: ["Team", "Project", "Task"]
  integrations: ["Slack"]
  constraints: []
  scope: "mvp"
```

## Output

```yaml
project_type: "fullstack"  # fullstack | backend | frontend | custom
components:
  - type: contract
    name: contract
  - type: server
    name: server
  - type: webapp
    name: webapp
  - type: database
    name: database
  - type: config
    name: config
  - type: testing
    name: testing
  - type: cicd
    name: cicd
```

**For multiple instances of the same type:**

```yaml
components:
  - type: server
    name: api                 # -> components/server-api/
  - type: server
    name: worker              # -> components/server-worker/
  - type: webapp
    name: admin               # -> components/webapp-admin/
  - type: webapp
    name: public              # -> components/webapp-public/
```

- Both `type` and `name` are ALWAYS required
- When `name` matches `type`, directory is `components/{type}/`
- When `name` differs from `type`, directory is `components/{type}-{name}/`

## Available Components

| Component | Description | Scaffolding Skill | Multi-Instance |
|-----------|-------------|-------------------|----------------|
| `contract` | OpenAPI specification | `contract-scaffolding` | No |
| `server` | Node.js backend (CMDO pattern) | `backend-scaffolding` | Yes |
| `webapp` | React frontend (MVVM pattern) | `frontend-scaffolding` | Yes |
| `database` | PostgreSQL migrations/seeds | `database-scaffolding` | No |
| `config` | YAML configuration | `project-scaffolding` | No |
| `helm` | Kubernetes Helm charts | (inline) | No |
| `testing` | Testkube test setup | (inline) | No |
| `cicd` | GitHub Actions workflows | (inline) | No |

## Component Dependencies

| Component | Requires | Notes |
|-----------|----------|-------|
| Contract | Server | OpenAPI spec needs a backend to implement it |
| Server | Contract | Backend requires API contract |
| Webapp | - | Can work standalone with external API |
| Database | Server | PostgreSQL database for backend data persistence |
| Config | - | Always required for all project types |
| Helm | Server | Kubernetes deployment is for backend services |
| Testing | Server or Webapp | Tests need something to test |
| CI/CD | Server or Webapp | Workflows need something to build/test |

## Workflow

### Step 1: Analyze Requirements

Map discovered information to technical needs:

| Discovery Element | Technical Implication |
|-------------------|----------------------|
| Multiple user types with different capabilities | Consider separate frontend apps |
| Data persistence mentioned | Database component needed |
| Third-party integrations | May need specific configuration |
| API/backend workflows | Server component needed |
| User-facing interface | Webapp component needed |

### Step 2: Present Recommendation

Based on analysis, present a recommendation with justification:

```
Based on what you've described, I recommend:

**Components:**
- **Backend API** - to handle <specific workflows from discovery>
- **Web Frontend** - for <specific user types from discovery>
- **Database** - to persist <specific entities from discovery>
- **Config** - for <integrations or environment settings>
[Additional components with justification based on discovery]

Does this match what you had in mind, or would you like to adjust?
```

### Step 3: Handle Adjustments

If user wants changes:

1. **Adding components**: Add to the list
2. **Removing components**: Remove, but check for dependencies
3. **Validate dependencies** (see table above):
   - Config is always auto-included
   - If Server is selected, Contract is auto-included
   - If Helm is selected, Server must be included
   - If Contract is selected without Server, warn and ask for confirmation

Re-present the adjusted recommendation until user confirms.

### Step 4: Multiple Component Instances

Check if multiple instances are needed based on discovery:

**For Webapp (if multiple user types need different UIs):**

If discovery revealed distinct user types that need separate interfaces:

```
I noticed you have <user-type-1> and <user-type-2>. Should these be separate web apps, or one app with different views?
```

- If separate: Ask "What should I call them? (e.g., 'admin', 'public')"
- Creates: `components/webapp-admin/`, `components/webapp-public/`, etc.

**For Server (if architecture suggests microservices):**

If discovery suggests need for separate backend services:

```
Should the backend be a single service or multiple? (e.g., api + worker)
```

- If multiple, for each: "Name for server component N:"
- Creates: `components/server-api/`, `components/server-worker/`, etc.

**Naming Rules:**
- Names must be lowercase
- Use hyphens, not underscores
- No spaces allowed
- Examples: `api`, `worker`, `admin`, `public`, `background-jobs`

### Step 5: Determine Project Type

Based on final component selection:

| Components Selected | Project Type |
|---------------------|--------------|
| Contract + Server + Webapp | `fullstack` |
| Contract + Server (no Webapp) | `backend` |
| Webapp only | `frontend` |
| Other combinations | `custom` |

### Step 6: Return Configuration

Return the final configuration as specified in the Output section.

## Examples

### Example 1: Standard Full-Stack

```
Discovery Results:
  user_personas:
    - type: "Project Manager"
    - type: "Team Member"
  core_workflows: ["Create projects", "Assign tasks", "Update progress"]
  domain_entities: ["Team", "Project", "Task", "User"]
  integrations: ["Slack"]

Recommendation:
  - Backend API (to handle project/task management, Slack notifications)
  - Web Frontend (for project managers and team members)
  - Database (to persist teams, projects, tasks, users)
  - Config (for Slack integration settings)

[User confirms]

Output:
  project_type: "fullstack"
  components:
    - type: contract
      name: contract
    - type: server
      name: server
    - type: webapp
      name: webapp
    - type: database
      name: database
    - type: config
      name: config
    - type: testing
      name: testing
    - type: cicd
      name: cicd
```

### Example 2: Multi-Frontend Architecture

```
Discovery Results:
  user_personas:
    - type: "Shopper" (browse, purchase)
    - type: "Merchant" (manage inventory)
    - type: "Admin" (internal operations)

Agent: I noticed you have shoppers, merchants, and admins with very different needs.
Should these be separate web apps, or one app with different views?

User: Separate apps for shopper/merchant, admin can use merchant app

Agent: What should I call them?

User: "storefront" and "merchant"

Output:
  project_type: "fullstack"
  components:
    - type: contract
      name: contract
    - type: server
      name: server
    - type: webapp
      name: storefront
    - type: webapp
      name: merchant
    - type: database
      name: database
    - type: config
      name: config
    - type: testing
      name: testing
    - type: cicd
      name: cicd
```

### Example 3: Backend Only

```
Discovery Results:
  product_description: "REST API backend"
  user_personas: []
  core_workflows: []

Agent: Based on what you've described, I recommend:
- Backend API - to handle your REST endpoints
- Config - for environment settings

No frontend needed since this is a backend-only project. Does this match?

User: Yes, but add database too

Output:
  project_type: "backend"
  components:
    - type: contract
      name: contract
    - type: server
      name: server
    - type: database
      name: database
    - type: config
      name: config
    - type: testing
      name: testing
    - type: cicd
      name: cicd
```

### Example 4: Microservices Architecture

```
Discovery Results:
  core_workflows:
    - "Process orders"
    - "Send notifications"
    - "Generate reports"

Agent: Should the backend be a single service or multiple?

User: Multiple - api for requests, worker for background jobs, scheduler for reports

Output:
  project_type: "custom"
  components:
    - type: contract
      name: contract
    - type: server
      name: api
    - type: server
      name: worker
    - type: server
      name: scheduler
    - type: webapp
      name: webapp
    - type: database
      name: database
    - type: config
      name: config
    - type: helm
      name: helm
    - type: testing
      name: testing
    - type: cicd
      name: cicd
```

## Notes

- This skill is conversational and handles user interaction for adjustments
- It does not create any files
- The output is used by `project-settings` and `scaffolding` skills
- Always validate dependencies before accepting the final configuration
