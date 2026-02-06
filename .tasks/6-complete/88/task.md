---
id: 88
title: Remove product-discovery skill
priority: high
status: complete
created: 2026-02-06
completed: 2026-02-06
---

# Task 88: Remove product-discovery skill ✓

## Summary

Removed the product-discovery skill and all references. Also removed domain-population from the speccing phase (deferred to implementation where it belongs). Verified all workflow input/output chains remain intact.

## Details

- Deleted `plugin/skills/product-discovery/` directory
- Removed product-discovery INVOKE from sdd-change.md interactive flow (Step 4) and external flow (deleted Step 7, renumbered 8-13 → 7-12)
- Removed domain-population from interactive flow Step 4 (belongs in implementation, not speccing)
- Updated component-discovery SKILL.md: removed legacy input section, added interactive mode input docs
- Updated domain-population SKILL.md: description, purpose, "When to Use", template placeholder
- Updated external-spec-integration SKILL.md: removed discovery_results param, made primary_domain optional
- Updated sdd-init.md: removed "Product discovery" from deferred list, fixed wording
- Updated docs/commands.md, docs/getting-started.md, docs/tutorial.md: removed all product-discovery references, fixed outdated --name argument
- Fixed dangling `default_domain: <from sdd-settings.yaml or discovery>` reference in decomposition step
