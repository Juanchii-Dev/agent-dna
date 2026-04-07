import { buildDocumentYaml } from "../../core/src/document";
import type { DnaAdapter } from "../../core/src/types";

export const stdoutAdapter: DnaAdapter = {
  name: "stdout",
  render: ({ document }) => buildDocumentYaml(document)
};
