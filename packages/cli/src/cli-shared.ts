import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, resolve } from "node:path";
import {
  applyDnaIgnore,
  mergeDnaDocuments,
  parseDnaIgnore,
  parseImportedDocument,
  parseOverrideDocument
} from "@agent-dna/core";
import type { AgentDnaDocument, DnaAdapterName } from "@agent-dna/core";

export const SUPPORTED_FORMATS = ["yaml", "json"] as const;
export const SUPPORTED_TOOLS = ["stdout", "codex", "cursor", "claude"] as const;
export const USAGE = `uso: agent-dna <comando> [argumentos]

Comandos principales
  init [ruta]                 crea ~/.agent-dna/dna.yaml o la ruta indicada
  import-repo [ruta]          extrae DNA portable desde AGENTS.md y CONTEXT.md
  show [archivo]              muestra el DNA resuelto
  validate [archivo]          valida el DNA contra el schema
  export [archivo]            exporta el DNA en yaml o json
  inject [archivo]            genera o escribe artefactos por herramienta
  run -- <comando>            ejecuta un comando con DNA inyectado

Comandos de contexto
  override <nombre|ruta>      activa un override
  override --clear            limpia el override activo
  diff [izq] [der]            compara DNA base y override
  hook <powershell|bash|git>  muestra o instala hooks

Compatibilidad
  resolve [archivo]           alias de export
  export-agents [archivo]     alias de inject --tool codex
  help                        muestra esta ayuda

Opciones
  --format <yaml|json>        formato de salida
  --out <ruta>                escribe el resultado en archivo
  --tool <tool>               stdout | codex | cursor | claude
  --field <ruta.dot>          filtra un campo del documento
  --override <ruta>           aplica override puntual
  --dnaignore <ruta>          usa un .dnaignore especifico
  --help, -h                  muestra ayuda

Ejemplos
  agent-dna init
  agent-dna import-repo .
  agent-dna show --field identity.name --format json
  agent-dna inject --tool codex
  agent-dna override pulse
  agent-dna run --tool cursor -- node script.js`;

export function getArg(flag: string, args: string[]) {
  const index = args.indexOf(flag);
  return index === -1 ? null : args[index + 1] ?? null;
}

export function getFormat(args: string[]) {
  const format = (getArg("--format", args) ?? "yaml") as (typeof SUPPORTED_FORMATS)[number];
  if (!SUPPORTED_FORMATS.includes(format)) {
    throw new Error(`Formato no soportado: ${format}`);
  }
  return format;
}

export function getTool(args: string[], fallback: DnaAdapterName = "stdout") {
  const tool = (getArg("--tool", args) ?? fallback) as DnaAdapterName;
  if (!SUPPORTED_TOOLS.includes(tool)) {
    throw new Error(`Tool no soportado: ${tool}`);
  }
  return tool;
}

export function getFieldValue(document: Record<string, unknown>, field: string | null) {
  if (!field) {
    return document;
  }

  return field.split(".").reduce<unknown>((current, segment) => {
    if (!current || typeof current !== "object" || !(segment in current)) {
      throw new Error(`Campo no encontrado: ${field}`);
    }
    return (current as Record<string, unknown>)[segment];
  }, document);
}

export async function readOptionalFile(filePath: string | null) {
  if (!filePath) {
    return null;
  }

  try {
    return await readFile(resolve(filePath), "utf8");
  } catch {
    return null;
  }
}

export function getAgentDnaHome() {
  return resolve(homedir(), ".agent-dna");
}

export function getDefaultDnaPath() {
  return resolve(getAgentDnaHome(), "dna.yaml");
}

export function getActiveOverridePath() {
  return resolve(getAgentDnaHome(), "active-override");
}

export async function resolveDnaIgnorePath(dnaPath: string, args: string[]) {
  const explicit = getArg("--dnaignore", args);
  if (explicit) {
    return resolve(explicit);
  }

  const sibling = resolve(dirname(dnaPath), ".dnaignore");
  const siblingContent = await readOptionalFile(sibling);
  return siblingContent ? sibling : null;
}

export async function resolveOverridePath(input: string) {
  const directPath = resolve(input);
  if (await readOptionalFile(directPath)) {
    return directPath;
  }

  const overridesRoot = resolve(getAgentDnaHome(), "overrides");
  for (const extension of [".yaml", ".yml", ".json"]) {
    const candidate = resolve(overridesRoot, `${input}${extension}`);
    if (await readOptionalFile(candidate)) {
      return candidate;
    }
  }

  throw new Error(`Override no encontrado: ${input}`);
}

export async function resolveBaseDnaPath(input: string | null) {
  if (input) {
    return resolve(input);
  }

  const defaultPath = getDefaultDnaPath();
  if (await readOptionalFile(defaultPath)) {
    return defaultPath;
  }

  throw new Error("Falta archivo DNA");
}

async function resolveConfiguredOverride(args: string[]) {
  const explicit = getArg("--override", args);
  if (explicit) {
    return resolve(explicit);
  }

  const configuredPath = getActiveOverridePath();
  const configured = await readOptionalFile(configuredPath);
  return configured?.trim() ? configured.trim() : null;
}

export async function loadResolvedDocument(filePath: string, args: string[]) {
  const absolutePath = resolve(filePath);
  const baseContent = await readFile(absolutePath, "utf8");
  const baseDocument = parseImportedDocument(baseContent, absolutePath.toLowerCase());

  const overridePath = await resolveConfiguredOverride(args);
  const overrideContent = await readOptionalFile(overridePath);
  const mergedDocument: AgentDnaDocument = overrideContent
    ? mergeDnaDocuments(baseDocument, parseOverrideDocument(overrideContent, resolve(overridePath!).toLowerCase()))
    : baseDocument;

  const tool = getArg("--tool", args) as DnaAdapterName | null;
  if (!tool) {
    return mergedDocument;
  }

  const dnaIgnorePath = await resolveDnaIgnorePath(absolutePath, args);
  const dnaIgnoreContent = await readOptionalFile(dnaIgnorePath);
  return dnaIgnoreContent ? applyDnaIgnore(mergedDocument, tool, parseDnaIgnore(dnaIgnoreContent)) : mergedDocument;
}
