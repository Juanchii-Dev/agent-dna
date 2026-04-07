import { buildDocumentYaml } from "./document";
import { buildAgentsPreview } from "./generators";
import type { AgentDnaDocument, AgentDnaState, DnaAdapter, DnaAdapterName } from "./types";
import { claudeAdapter } from "../../adapter-claude/src/index";

function buildCursorAdapterOutput(state: AgentDnaState) {
  return `cursor_context:
  active_project: "${state.project}"
  stack: "${state.stack}"
  code_rules:
    - "${state.neverRule}"
    - "${state.alwaysRule}"
  policy:
    secret_policy: "${state.secretPolicy}"`;
}

export const stdoutAdapter: DnaAdapter = {
  name: "stdout",
  render: ({ document }) => buildDocumentYaml(document)
};

export const codexAdapter: DnaAdapter = {
  name: "codex",
  fileName: "AGENTS.md",
  render: ({ state }) => buildAgentsPreview(state)
};

export const cursorAdapter: DnaAdapter = {
  name: "cursor",
  fileName: ".cursorrules",
  render: ({ state }) => buildCursorAdapterOutput(state)
};

const registry: Record<DnaAdapterName, DnaAdapter> = {
  stdout: stdoutAdapter,
  codex: codexAdapter,
  cursor: cursorAdapter,
  claude: claudeAdapter
};

export function getAdapter(name: DnaAdapterName) {
  return registry[name];
}

export function renderAdapter(name: DnaAdapterName, document: AgentDnaDocument, state: AgentDnaState) {
  return getAdapter(name).render({ document, state });
}

export function listAdapters() {
  return Object.values(registry);
}
