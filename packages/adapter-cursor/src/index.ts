import type { DnaAdapter } from "../../types/src/index";

export const cursorAdapter: DnaAdapter = {
  name: "cursor",
  version: "1.0.0",
  fileName: ".cursorrules",
  transform: ({ state }) => `cursor_context:
  active_project: "${state.project}"
  stack: "${state.stack}"
  code_rules:
    - "${state.neverRule}"
    - "${state.alwaysRule}"
  policy:
    secret_policy: "${state.secretPolicy}"`,
  inject: async () => undefined
};
