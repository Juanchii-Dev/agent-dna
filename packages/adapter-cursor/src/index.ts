import type { DnaAdapter } from "../../types/src/index";

export const cursorAdapter: DnaAdapter = {
  name: "cursor",
  fileName: ".cursorrules",
  render: ({ state }) => `cursor_context:
  active_project: "${state.project}"
  stack: "${state.stack}"
  code_rules:
    - "${state.neverRule}"
    - "${state.alwaysRule}"
  policy:
    secret_policy: "${state.secretPolicy}"`
};
