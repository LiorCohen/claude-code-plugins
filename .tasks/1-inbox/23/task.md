---
id: 23
title: Autocomplete for SDD command arguments
priority: inbox
status: open
created: 2026-01-25
---

# Task 23: Autocomplete for SDD command arguments

## Description

Need autocomplete support for **arguments** to SDD commands, not the command names themselves. For example:
- `/sdd-change implement <tab>` should show available change IDs
- `/sdd-change new <tab>` should suggest component names
- Argument completion based on context (existing specs, components, etc.)
