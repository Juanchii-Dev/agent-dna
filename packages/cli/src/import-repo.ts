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

function createEmptyDocument(): AgentDnaDocument {
  return {
    version: initialDnaDocument.version,
    identity: {
      name: "",
      role: ""
    },
    stack: {
      primary: []
    }
  };
}

function normalizeRule(rule: string) {
  return rule.replace(/`/g, "").replace(/\s+/g, " ").trim();
}

function canonicalRuleKey(rule: string) {
  const normalized = normalizeRule(rule)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (/spanish|espanol|español/.test(normalized) && /latino|tildes|output|responder/.test(normalized)) {
    return "language:es-latam";
  }

  if (/power(shell)?/.test(normalized) && /;/.test(normalized) && /&&/.test(normalized)) {
    return "shell:semicolon";
  }

  if (/any/.test(normalized) && /type(script)?/.test(normalized)) {
    return "typescript:no-any";
  }

  if (/schema|archivos|files/.test(normalized) && /audit|auditar/.test(normalized)) {
    return "workflow:audit-real-sources";
  }

  return normalized;
}

function dedupeRules(rules: string[]) {
  const seen = new Set<string>();
  return rules.filter((rule) => {
    const key = canonicalRuleKey(rule);
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
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
    always: dedupeRules(rules.filter((rule) => ALWAYS_RULE_PATTERN.test(rule) && !NEVER_RULE_PATTERN.test(rule))),
    never: dedupeRules(rules.filter((rule) => NEVER_RULE_PATTERN.test(rule)))
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
  const document = createEmptyDocument();

  document.identity = {
    name,
    role,
    output_language: detectOutputLanguage(agentsContent)
  };
  document.rules = {
    always: rules.always,
    never: rules.never
  };
  document.custom = {
    imported_from: "repo-docs"
  };

  return document;
}

function removeEmptySections(document: AgentDnaDocument) {
  const cleaned = structuredClone(document) as AgentDnaDocument & { custom?: Record<string, unknown> };

  if (cleaned.rules && (!cleaned.rules.always?.length && !cleaned.rules.never?.length && !cleaned.rules.formatting?.length)) {
    delete cleaned.rules;
  }

  if (cleaned.context && !Object.values(cleaned.context).some(Boolean)) {
    delete cleaned.context;
  }

  if (!cleaned.stack.primary.length && !cleaned.stack.backend?.length && !cleaned.stack.tools?.length && !cleaned.stack.avoid?.length) {
    cleaned.stack = { primary: [] };
  }

  if (cleaned.custom && Object.keys(cleaned.custom).length === 0) {
    delete cleaned.custom;
  }

  return cleaned;
}

function buildImportedOverrideDocument(projectName: string, repoName: string, contextContent: string | null): AgentDnaDocument {
  const document = createEmptyDocument();
  document.context = {
    active_project: detectActiveProject(contextContent, projectName)
  };
  document.custom = {
    imported_from_repo: repoName
  };

  return removeEmptySections(document);
}

function buildReviewRequired(baseDocument: AgentDnaDocument, overrideDocument: AgentDnaDocument) {
  const reviewRequired: string[] = [];

  if (!baseDocument.rules?.always?.length && !baseDocument.rules?.never?.length) {
    reviewRequired.push("No se detectaron reglas portables suficientes en AGENTS.md");
  }

  if (!overrideDocument.context?.active_project) {
    reviewRequired.push("No se detecto active_project confiable para el override del repo");
  }

  return reviewRequired;
}

function attachReviewRequired(baseDocument: AgentDnaDocument, overrideDocument: AgentDnaDocument) {
  const reviewRequired = buildReviewRequired(baseDocument, overrideDocument);
  if (!reviewRequired.length) {
    return { baseDocument, overrideDocument };
  }

  return {
    baseDocument: {
      ...baseDocument,
      custom: {
        ...(baseDocument.custom ?? {}),
        review_required: reviewRequired
      }
    },
    overrideDocument
  };
}

function ensureNoBaseContracts(document: AgentDnaDocument) {
  const cleaned = structuredClone(document);
  delete cleaned.db_contracts;
  delete cleaned.projects;
  delete cleaned.preferences;
  return cleaned;
}

function ensureDeltaOverride(document: AgentDnaDocument) {
  const cleaned = structuredClone(document);
  delete cleaned.identity;
  delete cleaned.rules;
  delete cleaned.projects;
  delete cleaned.preferences;
  delete cleaned.db_contracts;
  return removeEmptySections(cleaned);
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

  const baseDocument = ensureNoBaseContracts(buildImportedBaseDocument(name, role, agentsContent));
  const overrideDocument = ensureDeltaOverride(buildImportedOverrideDocument(project, repoName, contextContent));
  const result = attachReviewRequired(baseDocument, overrideDocument);

  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, buildDocumentYaml(result.baseDocument), "utf8");
  await writeFile(overrideOutPath, buildDocumentYaml(result.overrideDocument), "utf8");

  return { outPath, overrideOutPath };
}
