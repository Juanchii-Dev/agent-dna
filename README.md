# 🧬 Agent DNA

> **Open standard for portable AI identity.**

![Status](https://img.shields.io/badge/status-active%20buildout-0f766e)
![Schema](https://img.shields.io/badge/schema-1.0-111827)
![Mode](https://img.shields.io/badge/local--first-yes-2563eb)
![License](https://img.shields.io/badge/license-open%20standard-f59e0b)

Agent DNA turns developer identity, hard rules, stack, active context, project contracts, and communication preferences into a local-first document that can be validated, merged, filtered, and injected into different AI tools.

This repository is the implementation starter for that standard.

## ✨ Why this matters

Every AI tool starts with partial memory.

One assistant knows your stack but not your guardrails. Another knows the repo but not your output rules. Another remembers your tone but not your database contracts. Agent DNA solves that fragmentation with one portable source of truth.

## 🧱 What this repo includes

### `packages/core`
- document model
- JSON Schema
- parser and validator
- override merge engine
- `.dnaignore` filtering
- adapter registry

### `packages/cli`
- local CLI for `init`, `show`, `validate`, `export`, and `inject`

### `packages/adapter-*`
- `adapter-claude`
- `adapter-codex`
- `adapter-cursor`
- `adapter-stdout`

### `apps/demo`
- visual demo for exploring the format and generated outputs

### `examples`
- sample DNA
- real override example
- `.dnaignore` example

## 🎯 Current scope

### Implemented now

- spec-aligned `version: "1.0"` DNA document
- backward-compatible import of the legacy `agent_dna.*` shape
- local-first parsing and validation
- deep merge overrides by file
- tool filtering through `.dnaignore`
- adapter-based export and injection foundation
- monorepo-style structure aligned to the public spec

### Not implemented yet

- remote sync
- team registry
- CI actions
- IDE extensions
- hosted marketplace

## 🗂️ Repository structure

```text
packages/
  adapter-claude/
  adapter-codex/
  adapter-cursor/
  adapter-stdout/
  cli/
  core/
apps/
  demo/
examples/
```

## 🚀 Quick start

Install dependencies:

```powershell
npm install
```

Run the demo:

```powershell
npm run dev
```

Run quality checks:

```powershell
npm run test
npm run typecheck
npm run build
```

## 🛠️ CLI

Create a starter DNA:

```powershell
npm run cli -- init --out .\.agent-dna\dna.yaml
```

Validate a DNA file:

```powershell
npm run cli -- validate .\examples\agent-dna.yaml
```

Show a full document or one field:

```powershell
npm run cli -- show .\examples\agent-dna.yaml
npm run cli -- show .\examples\agent-dna.yaml --field rules --format json
```

Export a resolved document:

```powershell
npm run cli -- export .\examples\agent-dna.yaml --format yaml
npm run cli -- export .\examples\agent-dna.yaml --format json --out .\examples\resolved-agent-dna.json
```

Inject to a specific tool:

```powershell
npm run cli -- inject .\examples\agent-dna.yaml --tool codex
npm run cli -- inject .\examples\agent-dna.yaml --tool cursor
npm run cli -- inject .\examples\agent-dna.yaml --tool claude
```

Use a real override file:

```powershell
npm run cli -- export .\examples\agent-dna.yaml --override .\examples\overrides\pulse-enterprise.yaml --format yaml
```

Apply `.dnaignore` automatically by tool:

```powershell
npm run cli -- inject .\examples\agent-dna.yaml --tool codex
```

### Compatibility aliases

- `resolve` -> `export`
- `export-agents` -> `inject --tool codex`

## 📦 Example assets

- `examples/agent-dna.yaml`
- `examples/overrides/pulse-enterprise.yaml`
- `examples/.dnaignore`

These files are enough to test the parser, adapters, CLI, and demo without creating custom fixtures.

## 🧭 Design principles

- local-first by default
- open format over prompt hacks
- adapters instead of tool lock-in
- mergeable identity across contexts
- explicit guardrails over implicit memory
- source of truth before UI sugar

## 📍 Status

This repository is in active buildout toward the public Agent DNA spec.

It already behaves like a real toolkit, but it is still early-stage infrastructure and not yet a stable `1.0` production release.
