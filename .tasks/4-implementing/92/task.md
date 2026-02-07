---
id: 92
title: Merge ci-dev agent into devops agent
priority: medium
status: implementing
created: 2026-02-07
depends_on: []
blocks: []
---

# Task 92: Merge ci-dev agent into devops agent

## Description

Combine the CI/CD pipeline responsibilities from the `ci-dev` agent into the `devops` agent, then delete `ci-dev`. The two agents have natural overlap (both reference Testkube, both deal with build/deploy pipelines). Merging simplifies the agent roster.

## Acceptance Criteria

- [ ] CI/CD pipeline content (GitHub Actions, PR checks, build automation) merged into devops agent
- [ ] ci-dev.md deleted
- [ ] devops.md description updated to include CI/CD responsibilities
- [ ] All references to ci-dev updated across the codebase (docs, skills, changelogs, tests)
- [ ] Merged agent follows agents-standards
