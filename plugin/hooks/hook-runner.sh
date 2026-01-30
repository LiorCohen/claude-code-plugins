#!/bin/bash
# hook-runner.sh - Single entry point for all SDD hooks
# Passes hook name and stdin to the TypeScript CLI
exec node --enable-source-maps "${CLAUDE_PLUGIN_ROOT}/system/dist/cli.js" hook "$@"
