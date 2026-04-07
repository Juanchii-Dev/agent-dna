import { buildAgentsPreview } from "../../core/src/generators";
import type { DnaAdapter } from "../../types/src/index";

export const codexAdapter: DnaAdapter = {
  name: "codex",
  fileName: "AGENTS.md",
  render: ({ state }) => buildAgentsPreview(state)
};
