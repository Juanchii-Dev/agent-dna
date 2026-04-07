import type { DnaAdapter } from "../../core/src/index";

export const claudeAdapter: DnaAdapter = {
  name: "claude",
  fileName: "claude-memory.md",
  render: ({ state }) => `claude_memory:
  identity: "${state.name} · ${state.role}"
  business: "${state.business}"
  preferences:
    language: "${state.languageLabel}"
    tone: "${state.tone}"
  guardrails:
    - "${state.neverRule}"
    - "${state.boundaryRule}"`
};
