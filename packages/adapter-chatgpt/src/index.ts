import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { DnaAdapter } from "../../types/src/index";

function buildList(items: string[] | undefined, empty = "- none") {
  return items?.length ? items.map((item) => `- ${item}`).join("\n") : empty;
}

export const chatgptAdapter: DnaAdapter = {
  name: "chatgpt",
  version: "1.0.0",
  fileName: "chatgpt-personalization.md",
  transform: ({ document, state }) => {
    const about = [
      `Mi nombre es ${document.identity.name}.`,
      `Trabajo como ${document.identity.role}.`,
      document.context?.active_project ? `Mi proyecto activo es ${document.context.active_project}.` : null,
      document.stack.primary.length ? `Mi stack principal es ${document.stack.primary.join(", ")}.` : null,
      document.stack.backend?.length ? `Backend o servicios: ${document.stack.backend.join(", ")}.` : null,
      document.stack.tools?.length ? `Herramientas frecuentes: ${document.stack.tools.join(", ")}.` : null
    ]
      .filter(Boolean)
      .join(" ");

    const preferences = [
      `- Idioma de salida: ${document.identity.output_language ?? state.languageLabel}`,
      `- Tono: ${document.preferences?.tone ?? state.tone}`,
      document.preferences?.explanation_depth ? `- Profundidad de explicacion: ${document.preferences.explanation_depth}` : null,
      document.preferences?.ask_clarification ? `- Cuando falte contexto: ${document.preferences.ask_clarification}` : null
    ]
      .filter(Boolean)
      .join("\n");

    return [
      "# ChatGPT Personalization",
      "",
      "## Acerca de ti",
      about || `Trabajo en ${state.project}.`,
      "",
      "## Como quiero que respondas",
      preferences,
      "",
      "### Siempre",
      buildList(document.rules?.always),
      "",
      "### Nunca",
      buildList(document.rules?.never),
      "",
      "### Formato",
      buildList(document.rules?.formatting),
      "",
      "## Nota",
      "Usa estas secciones para completar la personalizacion persistente de ChatGPT en lugar de pegar contexto al inicio de cada chat."
    ]
      .filter(Boolean)
      .join("\n");
  },
  inject: async (output) => {
    const targetPath = resolve(process.cwd(), "chatgpt-personalization.md");
    await mkdir(dirname(targetPath), { recursive: true });
    await writeFile(targetPath, output, "utf8");
  }
};
