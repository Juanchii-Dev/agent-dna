import { buildAgentsPreview } from "../../core/src/generators";
import type { DnaAdapter } from "../../types/src/index";

export const codexAdapter: DnaAdapter = {
  name: "codex",
  version: "1.0.0",
  fileName: "AGENTS.md",
  transform: ({ state }) => buildAgentsPreview(state),
  inject: async () => undefined
};
