import { buildDocumentYaml } from "../../core/src/document";
import type { DnaAdapter } from "../../types/src/index";

export const stdoutAdapter: DnaAdapter = {
  name: "stdout",
  render: ({ document }) => buildDocumentYaml(document)
};
