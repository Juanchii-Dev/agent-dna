import type { DnaAdapter } from "../../types/src/index";

export const claudeAdapter: DnaAdapter = {
  name: "claude",
  version: "1.0.0",
  fileName: "claude-system.txt",
  transform: ({ document, state }) => {
    const primaryStack = document.stack.primary.join(", ");
    const backendStack = document.stack.backend?.join(", ");
    const tools = document.stack.tools?.join(", ");
    const alwaysRules = document.rules?.always?.map((rule) => `- ${rule}`).join("\n") ?? "- none";
    const neverRules = document.rules?.never?.map((rule) => `- ${rule}`).join("\n") ?? "- none";
    const formattingRules = document.rules?.formatting?.map((rule) => `- ${rule}`).join("\n") ?? "- none";

    return [
      "# Claude System Prompt — Agent DNA",
      "",
      "You are operating with the following persistent developer DNA context.",
      "Treat these constraints as active instructions for the full session.",
      "",
      "## Identity",
      `- Name: ${document.identity.name}`,
      `- Role: ${document.identity.role}`,
      `- Output language: ${document.identity.output_language ?? state.languageLabel}`,
      `- Tone: ${document.preferences?.tone ?? state.tone}`,
      "",
      "## Active context",
      `- Active project: ${document.context?.active_project ?? state.project}`,
      `- Business context: ${state.business}`,
      `- Primary stack: ${primaryStack}`,
      backendStack ? `- Backend stack: ${backendStack}` : null,
      tools ? `- Tools: ${tools}` : null,
      "",
      "## Always",
      alwaysRules,
      "",
      "## Never",
      neverRules,
      "",
      "## Output formatting",
      formattingRules,
      "",
      "## Hard constraints",
      `- Secret policy: ${state.secretPolicy}`,
      `- Approval mode: ${state.approvalMode}`,
      `- Boundary rule: ${state.boundaryRule}`
    ]
      .filter(Boolean)
      .join("\n");
  },
  inject: async () => undefined
};
