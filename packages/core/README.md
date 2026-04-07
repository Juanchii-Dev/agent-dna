# @agent-dna/core

Core open source de `Agent DNA`.

## Que expone

- `parseImportedDna`
- `resolveDna`
- `buildYamlPreview`
- `buildJsonPreview`
- `buildAgentsPreview`
- `buildPlatformPreviews`
- `initialDna`

## Schema

JSON Schema fuente:

- `schema/agent-dna.schema.json`

## Uso

```ts
import {
  parseImportedDna,
  resolveDna,
  buildAgentsPreview,
} from "@agent-dna/core";

const state = parseImportedDna(fileContent, "agent-dna.yaml");
const resolved = resolveDna(state, { team: true, project: true }, {
  team: {},
  project: {},
});
const agents = buildAgentsPreview(resolved);
```
