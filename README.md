# Skills

A library of Claude Code skills that encode engineering discipline so Claude follows it by default.

## Why

Out of the box Claude writes code competently, but shipping well needs more than that: investigate before building, design the interface before writing, test-first, review at PR boundaries, and verify before merge.

These skills bake those habits into Claude's defaults. Each one fires on its own trigger phrases — `tdd` when a task starts with a feature, `prod-ready` before merge, `pr-review` on someone else's PR, and so on — instead of waiting for me to remember to ask.

The goal: turn engineering discipline from something I have to enforce into something Claude reaches for automatically.

## Where things live

- [`skills/`](./skills/) — the skill set. See [`skills/README.md`](./skills/README.md) for the index, the role/trigger taxonomy, and how skills compose into workflows.

## Installation

You can install all the skills in this repository directly using `npx`:

```bash
npx github:ai-agent-lead/skills
```

### Options and Customization

By default, the installer runs in an interactive console wizard allowing you to select your targets. You can also specify flags to customize the installation target and scope:

- `--global`, `-g`       Install to personal/user-level global directories (e.g. `~/.claude/skills`)
- `--local`, `-l`        Install to current project/workspace directories (e.g. `./.claude/skills`)
- `--claude`            Install skills only for Claude Code
- `--codex`             Install skills only for Codex
- `--antigravity`, `-agy` Install skills only for Antigravity
- `--opencode`          Install skills only for OpenCode
- `--all`               Install skills for all supported assistants (default)
- `--force`, `-f`         Overwrite files without confirmation
- `--help`, `-h`          Show the help menu with all options

