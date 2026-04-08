import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { DnaAdapter } from "../../types/src/index";

function buildList(items: string[] | undefined, empty = "- none") {
  return items?.length ? items.map((item) => `- ${item}`).join("\n") : empty;
}

const CHAT_EXCLUDE_PATTERN =
  /\b(any|ts-ignore|typescript|cursor|codex|claude|powershell|&&|frontend|service_role|agentes|cursorrules|schemas?|endpoints?|rutas?|repo|rg global)\b/i;

function filterChatRules(items: string[] | undefined) {
  return (items ?? []).filter((item) => !CHAT_EXCLUDE_PATTERN.test(item));
}

function buildAboutText(document: Parameters<NonNullable<DnaAdapter["transform"]>>[0]["document"], state: Parameters<NonNullable<DnaAdapter["transform"]>>[0]["state"]) {
  return [
    `Mi nombre es ${document.identity.name}.`,
    `Trabajo como ${document.identity.role}.`,
    document.context?.active_project ? `Mi proyecto activo es ${document.context.active_project}.` : `Mi proyecto activo es ${state.project}.`,
    document.stack.primary.length ? `Mi stack principal es ${document.stack.primary.join(", ")}.` : null
  ]
    .filter(Boolean)
    .join(" ");
}

function buildInstructionsText(document: Parameters<NonNullable<DnaAdapter["transform"]>>[0]["document"], state: Parameters<NonNullable<DnaAdapter["transform"]>>[0]["state"]) {
  const alwaysRules = filterChatRules(document.rules?.always);
  const neverRules = filterChatRules(document.rules?.never);
  const formattingRules = filterChatRules(document.rules?.formatting);
  const preferences = [
    `- Idioma de salida: ${document.identity.output_language ?? state.languageLabel}`,
    `- Tono: ${document.preferences?.tone ?? state.tone}`,
    document.preferences?.explanation_depth ? `- Profundidad de explicacion: ${document.preferences.explanation_depth}` : null,
    document.preferences?.ask_clarification ? `- Cuando falte contexto: ${document.preferences.ask_clarification}` : null
  ]
    .filter(Boolean)
    .join("\n");

  return [
    "## Como quiero que respondas",
    preferences,
    "",
    "### Siempre",
    buildList(alwaysRules),
    "",
    "### Nunca",
    buildList(neverRules),
    "",
    "### Formato",
    buildList(formattingRules)
  ]
    .filter(Boolean)
    .join("\n");
}

export const chatgptAdapter: DnaAdapter = {
  name: "chatgpt",
  version: "1.0.0",
  fileName: "chatgpt-about.txt + chatgpt-instructions.txt",
  transform: ({ document, state }) => {
    return [
      "# ChatGPT Personalization",
      "",
      "## Acerca de ti",
      buildAboutText(document, state),
      "",
      buildInstructionsText(document, state),
      "",
      "## Nota",
      "Usa estas secciones para completar la personalizacion persistente de ChatGPT en lugar de pegar contexto al inicio de cada chat."
    ]
      .filter(Boolean)
      .join("\n");
  },
  inject: async (_output, input) => {
    const aboutPath = resolve(process.cwd(), "chatgpt-about.txt");
    const instructionsPath = resolve(process.cwd(), "chatgpt-instructions.txt");
    await mkdir(dirname(aboutPath), { recursive: true });
    await writeFile(aboutPath, buildAboutText(input.document, input.state), "utf8");
    await writeFile(instructionsPath, buildInstructionsText(input.document, input.state), "utf8");
  }
};
