# Agent DNA

Open source toolkit para identidad portable entre IAs.

`Agent DNA` busca convertir identidad, reglas, preferencias y contexto de trabajo en un formato reusable que pueda validarse, resolverse y exportarse a distintos artefactos y herramientas.

## Que incluye

- demo visual en React + Vite
- core reusable en `packages/core`
- adapters iniciales en `packages/adapter-claude`, `packages/adapter-codex`, `packages/adapter-cursor` y `packages/adapter-stdout`
- JSON Schema inicial del formato
- parser y resolver local
- generadores de `AGENTS.md`, YAML, JSON y salidas por plataforma
- CLI local en `packages/cli` para validar, resolver y exportar

## Stack

- React
- TypeScript
- Vite
- YAML
- Vitest

## Instalacion

```powershell
npm install
```

## Scripts

```powershell
npm run dev
npm run build
npm run test
npm run typecheck
```

## CLI

Crear un DNA inicial:

```powershell
npm run cli -- init --out .\.agent-dna\dna.yaml
```

Validar un DNA:

```powershell
npm run cli -- validate .\examples\agent-dna.yaml
```

Mostrar un DNA:

```powershell
npm run cli -- show .\examples\agent-dna.yaml
npm run cli -- show .\examples\agent-dna.yaml --field rules --format json
```

Exportar a YAML:

```powershell
npm run cli -- export .\examples\agent-dna.yaml --format yaml
```

Exportar a JSON:

```powershell
npm run cli -- export .\examples\agent-dna.yaml --format json --out .\examples\resolved-agent-dna.json
```

Inyectar a Codex:

```powershell
npm run cli -- inject .\examples\agent-dna.yaml --tool codex --out .\examples\AGENTS.md
```

Resolver con override real por archivo:

```powershell
npm run cli -- export .\examples\agent-dna.yaml --override .\examples\overrides\pulse-enterprise.yaml --format yaml
```

Resolver filtrado por herramienta usando `.dnaignore`:

```powershell
npm run cli -- inject .\examples\agent-dna.yaml --tool codex
```

Compatibilidad transitoria:

- `resolve` sigue funcionando como alias de `export`
- `export-agents` sigue funcionando como alias de `inject --tool codex`

## Estructura

```text
packages/
  adapter-claude/
    src/
  adapter-codex/
    src/
  adapter-cursor/
    src/
  adapter-stdout/
    src/
  cli/
    src/
  core/
    schema/
    src/
apps/
  demo/
    src/
    index.html
examples/
  .dnaignore
  agent-dna.yaml
  overrides/
    pulse-enterprise.yaml
```

## Core reusable

El paquete `packages/core/` expone:

- `parseImportedDna`
- `resolveDna`
- `buildYamlPreview`
- `buildJsonPreview`
- `buildAgentsPreview`
- `buildPlatformPreviews`

Schema fuente:

- `packages/core/schema/agent-dna.schema.json`

## Ejemplo

Fixture incluido:

- `examples/agent-dna.yaml`
- `examples/overrides/pulse-enterprise.yaml`
- `examples/.dnaignore`

Sirve para probar demo, parser, tests y CLI sin preparar archivos propios.

`.dnaignore` es opcional. La CLI lo toma automaticamente si existe al lado del DNA, o se puede pasar por `--dnaignore`.

## Estado actual

Estado actual del proyecto:

- formato inicial v0.1.0
- CLI local funcional
- demo visual funcional
- core con tests unitarios

Todavia no incluye MCP server ni persistencia remota.
