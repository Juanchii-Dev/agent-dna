import { buildAgentsPreview } from "../../core/src/generators";
import type { DnaAdapter } from "../../core/src/types";

export const codexAdapter: DnaAdapter = {
  name: "codex",
  fileName: "AGENTS.md",
  render: ({ state }) => buildAgentsPreview(state)
};
