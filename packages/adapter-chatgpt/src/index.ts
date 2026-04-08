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

function humanizeLanguage(language: string | undefined, fallback: string) {
  if (!language) {
    return fallback;
  }

  return language === "es" ? "español latino" : language;
}

function humanizeTone(tone: string | undefined, fallback: string) {
  const value = tone ?? fallback;
  if (/direct, no fluff/i.test(value)) {
    return "claro, directo y sin relleno";
  }

  return value;
}

function buildAboutText(document: Parameters<NonNullable<DnaAdapter["transform"]>>[0]["document"], state: Parameters<NonNullable<DnaAdapter["transform"]>>[0]["state"]) {
  const activeProject = document.context?.active_project ?? state.product;
  const role = document.identity.role === "Developer" ? "developer orientado a producto" : document.identity.role;
  return [
    `Mi nombre es ${document.identity.name}.`,
    `Trabajo como ${role}.`,
    activeProject ? `Actualmente estoy enfocado en ${activeProject}.` : null,
    document.stack.primary.length ? `Mi stack principal es ${document.stack.primary.join(", ")}.` : null,
    "Valoro respuestas claras, accionables y con buen criterio de negocio."
  ]
    .filter(Boolean)
    .join(" ");
}

function buildInstructionsText(document: Parameters<NonNullable<DnaAdapter["transform"]>>[0]["document"], state: Parameters<NonNullable<DnaAdapter["transform"]>>[0]["state"]) {
  const alwaysRules = filterChatRules(document.rules?.always);
  const neverRules = filterChatRules(document.rules?.never);
  const formattingRules = filterChatRules(document.rules?.formatting);
  const preferences = [
    `- Idioma de salida: ${humanizeLanguage(document.identity.output_language, state.languageLabel)}`,
    `- Tono: ${humanizeTone(document.preferences?.tone, state.tone)}`,
    document.preferences?.explanation_depth ? `- Profundidad de explicacion: ${document.preferences.explanation_depth}` : "- Profundidad de explicacion: breve por defecto, mas profunda si hace falta",
    document.preferences?.ask_clarification ? `- Cuando falte contexto: ${document.preferences.ask_clarification}` : "- Cuando falte contexto: preguntá solo lo mínimo necesario"
  ]
    .filter(Boolean)
    .join("\n");

  return [
    "## Como quiero que respondas",
    preferences,
    "",
    "### Siempre",
    buildList(
      alwaysRules.length
        ? alwaysRules
        : [
            "Respondé en español latino.",
            "Priorizá claridad, criterio y decisiones concretas.",
            "Si falta contexto, decilo explícitamente."
          ]
    ),
    "",
    "### Nunca",
    buildList(
      neverRules.length
        ? neverRules
        : [
            "No inventes contexto ni supuestos importantes.",
            "No rellenes con texto innecesario."
          ]
    ),
    "",
    "### Formato",
    buildList(
      formattingRules.length
        ? formattingRules
        : [
            "Respuestas simples, humanas y directas.",
            "Usá listas solo cuando realmente ayuden."
          ]
    )
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
