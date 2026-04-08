# Agent DNA

> Portable AI identity for developers. Local-first, adapter-based, open by default.

[![npm version](https://img.shields.io/npm/v/agent-dna?color=0f766e)](https://www.npmjs.com/package/agent-dna)
[![npm core](https://img.shields.io/npm/v/%40tuwebai%2Fcore?color=111827)](https://www.npmjs.com/package/@tuwebai/core)
[![npm types](https://img.shields.io/npm/v/%40tuwebai%2Ftypes?color=2563eb)](https://www.npmjs.com/package/@tuwebai/types)
[![License: MIT](https://img.shields.io/badge/license-MIT-f59e0b)](./LICENSE)

Agent DNA defines a single developer document that can be validated, merged, filtered, exported, and injected into multiple AI tools without rebuilding context from zero on every session.

This repo is the current open-source implementation of that standard.

## Why it exists

Most AI workflows still depend on fragmented memory:

- one tool knows your stack but not your hard rules
- another knows the repo but not your output language
- another remembers your tone but not your project contracts

Agent DNA turns that into one portable source of truth:

- identity
- stack
- rules
- active context
- project registry
- database contracts
- communication preferences

## What is already real in this repo

### Core standard

- `version: "1.0"` document model
- JSON Schema validation
- backward-compatible import for the legacy `agent_dna.*` shape
- normalization and resolved document output
- deep-merge override system
- `.dnaignore` filtering per tool

### CLI

- `agent-dna init`
- `agent-dna show`
- `agent-dna validate`
- `agent-dna export`
- `agent-dna inject`
- `agent-dna override`
- `agent-dna diff`
- `agent-dna run`
- `agent-dna hook`

### Adapters

- `codex` -> writes `AGENTS.md`
- `cursor` -> writes `.cursorrules`
- `claude` -> writes `claude-system.txt`
- `stdout` -> prints raw output

### Published packages

- [`agent-dna`](https://www.npmjs.com/package/agent-dna)
- [`@tuwebai/core`](https://www.npmjs.com/package/@tuwebai/core)
- [`@tuwebai/types`](https://www.npmjs.com/package/@tuwebai/types)

## Repo structure

```text
apps/
  demo/                     # visual demo for the format and outputs

examples/
  agent-dna.yaml            # sample DNA document
  overrides/
    pulse-enterprise.yaml   # sample override
  .dnaignore                # sample field filtering

packages/
  adapter-claude/           # claude output adapter
  adapter-codex/            # codex -> AGENTS.md
  adapter-cursor/           # cursor -> .cursorrules
  adapter-stdout/           # stdout adapter
  cli/                      # published CLI package
  core/                     # parser, schema, resolver, generators
  types/                    # shared public types
```

## Quick start

### Install globally

```powershell
npm install -g agent-dna
agent-dna --help
```

### Install locally for development

```powershell
npm install
npm run dev
```

### Quality checks

```powershell
npm run test
npm run typecheck
npm run build
```

## Local-first runtime

By default, the CLI works against this filesystem layout:

```text
~/.agent-dna/
├── dna.yaml
├── overrides/
├── active-override
└── .dnaignore
```

That means the default workflow is global, not repo-bound.

## CLI usage

### Create your DNA

```powershell
agent-dna init
```

### Validate the current document

```powershell
agent-dna validate
```

### Inspect one field

```powershell
agent-dna show --field identity.name --format json
```

### Export resolved DNA

```powershell
agent-dna export --format yaml
agent-dna export --format json --out .\resolved-agent-dna.json
```

### Inject tool-specific artifacts

```powershell
agent-dna inject --tool codex
agent-dna inject --tool cursor
agent-dna inject --tool claude
```

Generated outputs:

- `codex` -> `AGENTS.md`
- `cursor` -> `.cursorrules`
- `claude` -> `claude-system.txt`

### Work with overrides

```powershell
agent-dna override pulse
agent-dna show
agent-dna override --clear
```

### Wrap another command with injected DNA

```powershell
agent-dna run --tool codex -- node script.js
```

### Show the full command help

```powershell
agent-dna --help
```

## Development workflow

### Run the local CLI without global install

```powershell
npm run cli -- --help
npm run cli -- init
npm run cli -- validate .\examples\agent-dna.yaml
```

### Test against included fixtures

```powershell
npm run cli -- show .\examples\agent-dna.yaml --field identity --format json
npm run cli -- export .\examples\agent-dna.yaml --format yaml
npm run cli -- inject .\examples\agent-dna.yaml --tool codex
npm run cli -- override pulse-enterprise
```

## Package responsibilities

| Package | Purpose |
|---|---|
| [`agent-dna`](https://www.npmjs.com/package/agent-dna) | End-user CLI |
| [`@tuwebai/core`](https://www.npmjs.com/package/@tuwebai/core) | Schema, parser, resolver, generators, adapter registry |
| [`@tuwebai/types`](https://www.npmjs.com/package/@tuwebai/types) | Shared public types |

## Current product boundaries

Implemented now:

- local-first runtime
- schema-driven validation
- override layering
- adapter-based artifact generation
- Windows-friendly CLI flow
- published npm packages

Not implemented yet:

- cloud sync
- team distribution flows
- CI action packages
- IDE extensions
- marketplace
- hosted control plane

## Design principles

- local-first before platform
- standard before product surface
- source of truth before prompt hacks
- adapters over tool lock-in
- explicit rules over implicit memory
- portable context over repo-specific islands

## Links

- Repository: [github.com/Juanchii-Dev/agent-dna](https://github.com/Juanchii-Dev/agent-dna)
- CLI package: [npmjs.com/package/agent-dna](https://www.npmjs.com/package/agent-dna)
- Core package: [npmjs.com/package/@tuwebai/core](https://www.npmjs.com/package/@tuwebai/core)
- Types package: [npmjs.com/package/@tuwebai/types](https://www.npmjs.com/package/@tuwebai/types)

## Status

Agent DNA is already usable as a real local toolkit, but it is still a pre-`1.0` standard in active buildout.
