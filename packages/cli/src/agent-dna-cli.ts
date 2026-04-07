import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  applyDnaIgnore,
  buildDocumentJson,
  buildDocumentYaml,
  getAdapter,
  initialDnaDocument,
  mapDocumentToState,
  mergeDnaDocuments,
  parseDnaIgnore,
  parseImportedDocument,
  parseOverrideDocument,
  renderAdapter
} from "../../core/src/index";
import type { DnaAdapterName } from "../../core/src/index";

type Command =
  | "export"
  | "export-agents"
  | "init"
  | "inject"
  | "resolve"
  | "show"
  | "validate";

function getArg(flag: string, args: string[]) {
  const index = args.indexOf(flag);
  return index === -1 ? null : args[index + 1] ?? null;
}

async function readOptionalFile(filePath: string | null) {
  if (!filePath) {
    return null;
  }

  try {
    return await readFile(resolve(filePath), "utf8");
  } catch {
    return null;
  }
}

async function resolveDnaIgnorePath(dnaPath: string, args: string[]) {
  const explicit = getArg("--dnaignore", args);
  if (explicit) {
    return resolve(explicit);
  }

  const sibling = resolve(dirname(dnaPath), ".dnaignore");
  const siblingContent = await readOptionalFile(sibling);
  return siblingContent ? sibling : null;
}

async function loadResolvedDocument(filePath: string, args: string[]) {
  const absolutePath = resolve(filePath);
  const baseContent = await readFile(absolutePath, "utf8");
  const baseDocument = parseImportedDocument(baseContent, absolutePath.toLowerCase());

  const overridePath = getArg("--override", args);
  const overrideContent = await readOptionalFile(overridePath);
  const mergedDocument = overrideContent
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

async function writeOutput(outPath: string | null, output: string, successMessage: string) {
  if (!outPath) {
    console.log(output);
    return;
  }

  const absolutePath = resolve(outPath);
  await mkdir(dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, output, "utf8");
  console.log(`${successMessage} ${absolutePath}`);
}

async function handleInit(args: string[]) {
  const outPath = resolve(getArg("--out", args) ?? ".agent-dna/dna.yaml");
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, buildDocumentYaml(initialDnaDocument), "utf8");
  console.log(`DNA inicial creado en ${outPath}`);
}

async function handleValidate(filePath: string, args: string[]) {
  await loadResolvedDocument(filePath, args);
  console.log("agent_dna valido");
}

async function handleShow(filePath: string, args: string[]) {
  const document = await loadResolvedDocument(filePath, args);
  const field = getArg("--field", args);
  const format = getArg("--format", args) ?? "yaml";
  const selected = field ? (document as Record<string, unknown>)[field] : document;
  const output =
    format === "json"
      ? JSON.stringify(selected, null, 2)
      : buildDocumentYaml(selected as typeof document).trimEnd();

  console.log(output);
}

async function handleExport(filePath: string, args: string[]) {
  const document = await loadResolvedDocument(filePath, args);
  const outPath = getArg("--out", args);
  const format = getArg("--format", args) ?? "yaml";
  const output = format === "json" ? buildDocumentJson(document) : buildDocumentYaml(document);
  await writeOutput(outPath, output, "DNA exportado en");
}

async function handleInject(filePath: string, args: string[]) {
  const tool = (getArg("--tool", args) ?? "stdout") as DnaAdapterName;
  const document = await loadResolvedDocument(filePath, args);
  const state = mapDocumentToState(document);
  const adapter = getAdapter(tool);
  const output = adapter.render({ document, state });
  const outPath = getArg("--out", args);
  await writeOutput(outPath, output, `${tool} exportado en`);
}

async function main() {
  const [, , rawCommand, rawFile, ...rest] = process.argv;
  const command = rawCommand as Command | undefined;

  if (!command) {
    console.error(
      "Uso: npm run cli -- <init|show|validate|export|inject|resolve|export-agents> [archivo] [--format yaml|json] [--out ruta] [--override ruta] [--tool codex|cursor|claude|stdout] [--dnaignore ruta]"
    );
    process.exit(1);
  }

  if (command === "init") {
    await handleInit(rawFile ? [rawFile, ...rest] : rest);
    process.exit(0);
  }

  if (!rawFile) {
    console.error("Falta archivo DNA");
    process.exit(1);
  }

  switch (command) {
    case "validate":
      await handleValidate(rawFile, rest);
      break;
    case "show":
      await handleShow(rawFile, rest);
      break;
    case "export":
    case "resolve":
      await handleExport(rawFile, rest);
      break;
    case "inject":
      await handleInject(rawFile, rest);
      break;
    case "export-agents":
      await handleInject(rawFile, ["--tool", "codex", ...rest]);
      break;
    default:
      console.error(`Comando no soportado: ${rawCommand}`);
      process.exit(1);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Error desconocido";
  console.error(message);
  process.exit(1);
});
