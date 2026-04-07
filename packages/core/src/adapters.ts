import type { AgentDnaDocument, AgentDnaState, DnaAdapter, DnaAdapterName } from "./types";
import { claudeAdapter } from "../../adapter-claude/src/index";
import { codexAdapter } from "../../adapter-codex/src/index";
import { cursorAdapter } from "../../adapter-cursor/src/index";
import { stdoutAdapter } from "../../adapter-stdout/src/index";

export { codexAdapter, cursorAdapter, stdoutAdapter };

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
