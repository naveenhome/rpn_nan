#!/usr/bin/env bash
# Advisory PostToolUse hook (Edit|Write|MultiEdit).
# For changed source under apps/ or libs/ (.ts/.html/.scss, excluding *.spec.ts),
# emit additionalContext nudging a code-reviewer subagent. Never blocks: always exit 0.
set -uo pipefail

input="$(cat)"
file="$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty' 2>/dev/null)"
[ -z "$file" ] && exit 0

# Scope: only apps/** or libs/**
case "$file" in
  */apps/*|*/libs/*|apps/*|libs/*) ;;
  *) exit 0 ;;
esac

# Source files only; skip tests
case "$file" in
  *.spec.ts) exit 0 ;;
  *.ts|*.html|*.scss) ;;
  *) exit 0 ;;
esac

jq -n --arg f "$file" '{
  hookSpecificOutput: {
    hookEventName: "PostToolUse",
    additionalContext: ("Changed source file: " + $f + ". Launch the code-reviewer subagent (Agent tool, subagent_type \"code-reviewer\") to review this file'\''s latest diff for correctness, scope creep, and convention issues, then relay its findings concisely. Advisory only — do not block or auto-fix.")
  }
}'
exit 0
