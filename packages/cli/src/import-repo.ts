import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { buildDocumentYaml, initialDnaDocument, type AgentDnaDocument } from "@agent-dna/core";
import { getArg, readOptionalFile } from "./cli-shared";

type ImportRepoInput = {
  args: string[];
  target: string | null;
};

const SKIP_RULE_PATTERN =
  /AGENTS\.md|CONTEXT\.md|CODEX-EFFICIENCY|skills\/|docs\/|slice|token|commentary|gitignore|\.sql|migraciones|tool call|qa|deploy/i;
const NEVER_RULE_PATTERN =
  /\b(nunca|never|prohibido|no usar|no inventar|no exponer|no forzar|no mezclar|no asumir|no narrar|sin )\b/i;
const ALWAYS_RULE_PATTERN = /\b(siempre|always|responder|usar |aplicar|mantener|preferir|corregir|trabajar)\b/i;

function normalizeRule(rule: string) {
  return rule.replace(/`/g, "").replace(/\s+/g, " ").trim();
}

function extractPortableRules(content: string | null) {
  if (!content) {
    return { always: [] as string[], never: [] as string[] };
  }

  const rules = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => normalizeRule(line.slice(2)))
    .filter((line) => line.length > 0 && !SKIP_RULE_PATTERN.test(line));

  return {
    always: rules.filter((rule) => ALWAYS_RULE_PATTERN.test(rule) && !NEVER_RULE_PATTERN.test(rule)),
    never: rules.filter((rule) => NEVER_RULE_PATTERN.test(rule))
  };
}

function detectOutputLanguage(content: string | null) {
  if (!content) {
    return undefined;
  }

  return /español|espanol/i.test(content) ? "es" : undefined;
}

function detectActiveProject(content: string | null, fallback: string) {
  if (!content) {
    return fallback;
  }

  const match = content.match(/active_project[:\s-]*["`]?([A-Za-z0-9 _-]+)/i);
  return match?.[1]?.trim() || fallback;
}

function buildImportedBaseDocument(name: string, role: string, agentsContent: string | null): AgentDnaDocument {
  const rules = extractPortableRules(agentsContent);
  return {
    ...initialDnaDocument,
    identity: {
      ...initialDnaDocument.identity,
      name,
      role,
      output_language: detectOutputLanguage(agentsContent)
    },
    rules: {
      always: rules.always,
      never: rules.never,
      formatting: initialDnaDocument.rules?.formatting ?? []
    },
    custom: {
      imported_from: "repo-docs"
    }
  };
}

function buildImportedOverrideDocument(projectName: string, repoName: string, contextContent: string | null): AgentDnaDocument {
  return {
    ...initialDnaDocument,
    identity: {
      ...initialDnaDocument.identity,
      name: repoName,
      role: "Project Override"
    },
    context: {
      active_project: detectActiveProject(contextContent, projectName)
    },
    custom: {
      imported_from_repo: repoName
    }
  };
}

export async function importRepoDocuments({ args, target }: ImportRepoInput) {
  const repoPath = resolve(target ?? ".");
  const repoName = basename(repoPath);
  const importRoot = resolve(repoPath, ".agent-dna", "imports");
  const outPath = resolve(getArg("--out", args) ?? resolve(importRoot, `${repoName}.yaml`));
  const overrideOutPath = resolve(getArg("--override-out", args) ?? resolve(importRoot, `${repoName}.override.yaml`));
  const name = getArg("--name", args) ?? process.env.USERNAME ?? "Imported Developer";
  const role = getArg("--role", args) ?? "Developer";
  const project = getArg("--project", args) ?? repoName;
  const agentsContent = await readOptionalFile(resolve(repoPath, "AGENTS.md"));
  const contextContent = await readOptionalFile(resolve(repoPath, "CONTEXT.md"));

  const baseDocument = buildImportedBaseDocument(name, role, agentsContent);
  const overrideDocument = buildImportedOverrideDocument(project, repoName, contextContent);

  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, buildDocumentYaml(baseDocument), "utf8");
  await writeFile(overrideOutPath, buildDocumentYaml(overrideDocument), "utf8");

  return { outPath, overrideOutPath };
}
