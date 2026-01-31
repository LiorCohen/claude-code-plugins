---
id: 25
title: Planner must block on open questions in specs
status: consolidated
created: 2026-01-25
consolidated_into: 64
---

# Task 25: Planner must block on open questions in specs → consolidated into #64

<!-- Original content preserved below -->

## Description

When specs contain open questions, implementation cannot proceed. The planner must:
- Detect open questions in specs before planning
- Block/halt if unresolved questions exist
- Require questions to be resolved before allowing implementation to begin
- Provide clear guidance on which questions need answers
