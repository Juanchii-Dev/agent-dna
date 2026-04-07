import { buildDocumentJson, buildDocumentYaml, syncDocumentWithState } from "./document";
import type { AgentDnaDocument, AgentDnaState, PlatformPreview } from "./types";

export function buildYamlPreview(dna: AgentDnaState, document?: AgentDnaDocument) {
  return buildDocumentYaml(syncDocumentWithState(dna, document));
}

export function buildAgentsPreview(dna: AgentDnaState) {
  return `# AGENTS.md - Protocolo Core ${dna.product}

## TL;DR operativo

- responder siempre en ${dna.languageLabel}
- ${dna.languageRule}
- ${dna.alwaysRule}
- no romper estas reglas: ${dna.neverRule}

## Contexto activo

- proyecto: ${dna.project}
- rol: ${dna.role}
- stack: ${dna.stack}
- negocio: ${dna.business}

## Restricciones duras

- ${dna.boundaryRule}
- politica de secretos: ${dna.secretPolicy}
- modo de aprobacion: ${dna.approvalMode}`;
}

export function buildJsonPreview(dna: AgentDnaState, document?: AgentDnaDocument) {
  return buildDocumentJson(syncDocumentWithState(dna, document));
}

function buildCodexPreview(dna: AgentDnaState) {
  return `codex_profile:
  project: "${dna.project}"
  language: "${dna.language}"
  tone: "${dna.tone}"
  rules:
    always:
      - "${dna.alwaysRule}"
      - "${dna.languageRule}"
    never:
      - "${dna.neverRule}"
      - "${dna.boundaryRule}"`;
}

function buildClaudePreview(dna: AgentDnaState) {
  return `claude_memory:
  identity: "${dna.name} · ${dna.role}"
  business: "${dna.business}"
  preferences:
    language: "${dna.languageLabel}"
    tone: "${dna.tone}"
  guardrails:
    - "${dna.neverRule}"
    - "${dna.boundaryRule}"`;
}

function buildCursorPreview(dna: AgentDnaState) {
  return `cursor_context:
  active_project: "${dna.project}"
  stack: "${dna.stack}"
  code_rules:
    - "${dna.neverRule}"
    - "${dna.alwaysRule}"
  policy:
    secret_policy: "${dna.secretPolicy}"`;
}

export function buildPlatformPreviews(dna: AgentDnaState): PlatformPreview[] {
  return [
    { name: "Codex", content: buildCodexPreview(dna) },
    { name: "Claude", content: buildClaudePreview(dna) },
    { name: "Cursor", content: buildCursorPreview(dna) }
  ];
}
