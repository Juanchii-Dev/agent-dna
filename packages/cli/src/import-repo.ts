import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { buildDocumentYaml, initialDnaDocument, type AgentDnaDocument } from "@agent-dna/core";
import { getArg, readOptionalFile } from "./cli-shared";

type ImportRepoInput = {
  args: string[];
  target: string | null;
};

type CandidateRule = {
  confidence: "high" | "medium" | "low";
  portability: "high" | "medium" | "low";
  reviewRequired: boolean;
  sourceFile: string;
  sourceSection: string;
  target: "rules.always" | "rules.never" | "review";
  text: string;
};

const SKIP_RULE_PATTERN =
  /AGENTS\.md|CONTEXT\.md|CODEX-EFFICIENCY|skills\/|docs\/|slice|token|commentary|gitignore|\.sql|migraciones|tool call|qa|deploy/i;
const NEVER_RULE_PATTERN =
  /\b(nunca|never|prohibido|no usar|no inventar|no exponer|no forzar|no mezclar|no asumir|no narrar|sin )\b/i;
const ALWAYS_RULE_PATTERN = /\b(siempre|always|responder|usar |aplicar|mantener|preferir|corregir|trabajar)\b/i;
const MOJIBAKE_REPAIRS: Array<[RegExp, string]> = [
  [/espaÃƒÂ±ol/gi, "español"],
  [/espaÃ±ol/gi, "español"],
  [/ÃƒÂ¡/g, "á"],
  [/ÃƒÂ©/g, "é"],
  [/ÃƒÂ­/g, "í"],
  [/ÃƒÂ³/g, "ó"],
  [/ÃƒÂº/g, "ú"],
  [/ÃƒÂ±/g, "ñ"],
  [/Ã¡/g, "á"],
  [/Ã©/g, "é"],
  [/Ã­/g, "í"],
  [/Ã³/g, "ó"],
  [/Ãº/g, "ú"],
  [/Ã±/g, "ñ"],
  [/Ã¢â‚¬Å“/g, "“"],
  [/Ã¢â‚¬Â/g, "”"],
  [/Ã¢â‚¬Ëœ/g, "‘"],
  [/Ã¢â‚¬â„¢/g, "’"],
  [/â€œ/g, "“"],
  [/â€/g, "”"],
  [/â€˜/g, "‘"],
  [/â€™/g, "’"]
];

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
  let normalized = rule;
  for (const [pattern, replacement] of MOJIBAKE_REPAIRS) {
    normalized = normalized.replace(pattern, replacement);
  }

  return normalized.replace(/`/g, "").replace(/\s+/g, " ").trim();
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

function classifyConfidence(rule: string, sourceFile: string, sourceSection: string): CandidateRule["confidence"] {
  if (sourceFile === "AGENTS.md" && /TL;DR|Reglas no negociables|Guardrails/i.test(sourceSection)) {
    return "high";
  }

  if (/siempre|nunca|never|always/i.test(rule)) {
    return "high";
  }

  if (sourceFile === "AGENTS.md") {
    return "medium";
  }

  return "low";
}

function classifyPortability(rule: string, sourceFile: string): CandidateRule["portability"] {
  if (SKIP_RULE_PATTERN.test(rule)) {
    return "low";
  }

  if (sourceFile === "AGENTS.md" && /espanol|español|typescript|power(shell)?|schema|secretos|frontend/i.test(rule)) {
    return "high";
  }

  return sourceFile === "AGENTS.md" ? "medium" : "low";
}

function extractCandidateRules(content: string | null, sourceFile: string) {
  if (!content) {
    return [] as CandidateRule[];
  }

  let currentSection = "root";
  const candidates: CandidateRule[] = [];

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    if (line.startsWith("#")) {
      currentSection = normalizeRule(line.replace(/^#+\s*/, "").trim()) || "root";
      continue;
    }

    if (!line.startsWith("- ")) {
      continue;
    }

    const text = normalizeRule(line.slice(2));
    if (!text || SKIP_RULE_PATTERN.test(text)) {
      continue;
    }

    const target = NEVER_RULE_PATTERN.test(text)
      ? "rules.never"
      : ALWAYS_RULE_PATTERN.test(text)
        ? "rules.always"
        : "review";
    const portability = classifyPortability(text, sourceFile);
    const confidence = classifyConfidence(text, sourceFile, currentSection);

    candidates.push({
      confidence,
      portability,
      reviewRequired: portability === "low" || target === "review" || confidence === "low",
      sourceFile,
      sourceSection: currentSection,
      target,
      text
    });
  }

  return candidates;
}

function dedupeCandidates(candidates: CandidateRule[]) {
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    const key = `${candidate.target}:${canonicalRuleKey(candidate.text)}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function extractPortableRules(candidates: CandidateRule[]) {
  const accepted = candidates.filter((candidate) => !candidate.reviewRequired && candidate.portability !== "low");

  return {
    always: dedupeRules(accepted.filter((candidate) => candidate.target === "rules.always").map((candidate) => candidate.text)),
    never: dedupeRules(accepted.filter((candidate) => candidate.target === "rules.never").map((candidate) => candidate.text))
  };
}

function detectOutputLanguage(content: string | null) {
  if (!content) {
    return undefined;
  }

  return /español|espanol/i.test(normalizeRule(content)) ? "es" : undefined;
}

function detectActiveProject(content: string | null, fallback: string) {
  if (!content) {
    return fallback;
  }

  const match = content.match(/active_project[:\s-]*["`]?([A-Za-z0-9 _-]+)/i);
  return match?.[1]?.trim() || fallback;
}

function inferStack(content: string | null) {
  const normalized = normalizeRule(content ?? "").toLowerCase();
  const primary: string[] = [];
  const tools: string[] = [];

  if (/typescript/.test(normalized)) {
    primary.push("TypeScript");
  }
  if (/\breact\b/.test(normalized)) {
    primary.push("React");
  }
  if (/vite/.test(normalized)) {
    primary.push("Vite");
  }
  if (/tailwind/.test(normalized)) {
    primary.push("Tailwind CSS");
  }
  if (/supabase/.test(normalized)) {
    primary.push("Supabase");
  }
  if (/postgres/.test(normalized)) {
    primary.push("PostgreSQL");
  }
  if (/\bnode\b/.test(normalized)) {
    primary.push("Node.js");
  }
  if (/express/.test(normalized)) {
    primary.push("Express");
  }
  if (/powershell/.test(normalized)) {
    tools.push("PowerShell");
  }
  if (/\bgit\b/.test(normalized)) {
    tools.push("Git");
  }

  if (!primary.length) {
    primary.push("TypeScript");
  }

  return {
    primary: dedupeRules(primary),
    tools: dedupeRules(tools)
  };
}

function buildImportedBaseDocument(name: string, role: string, agentsContent: string | null, candidates: CandidateRule[]): AgentDnaDocument {
  const rules = extractPortableRules(candidates);
  const document = createEmptyDocument();
  const inferredStack = inferStack(agentsContent);

  document.identity = {
    name,
    role,
    output_language: detectOutputLanguage(agentsContent)
  };
  document.stack = {
    primary: inferredStack.primary,
    ...(inferredStack.tools.length ? { tools: inferredStack.tools } : {})
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

function buildImportReport(candidates: CandidateRule[], baseDocument: AgentDnaDocument, overrideDocument: AgentDnaDocument) {
  const accepted = candidates.filter((candidate) => !candidate.reviewRequired && candidate.portability !== "low");
  const review = candidates.filter((candidate) => candidate.reviewRequired || candidate.portability === "low");

  return [
    "# Import Report",
    "",
    `Accepted rules: ${accepted.length}`,
    `Review required: ${review.length}`,
    `Base active project: ${baseDocument.context?.active_project ?? "none"}`,
    `Override active project: ${overrideDocument.context?.active_project ?? "none"}`,
    "",
    "## Accepted",
    ...accepted.map(
      (candidate) => `- [${candidate.target}] ${candidate.text} (${candidate.sourceFile} > ${candidate.sourceSection})`
    ),
    "",
    "## Review Required",
    ...review.map(
      (candidate) =>
        `- [${candidate.target}] ${candidate.text} | confidence=${candidate.confidence} portability=${candidate.portability}`
    )
  ].join("\n");
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
  const reportOutPath = resolve(getArg("--report-out", args) ?? resolve(importRoot, `${repoName}.import-report.md`));
  const name = getArg("--name", args) ?? process.env.USERNAME ?? "Imported Developer";
  const role = getArg("--role", args) ?? "Developer";
  const project = getArg("--project", args) ?? repoName;
  const agentsContent = await readOptionalFile(resolve(repoPath, "AGENTS.md"));
  const contextContent = await readOptionalFile(resolve(repoPath, "CONTEXT.md"));
  const candidates = dedupeCandidates(extractCandidateRules(agentsContent, "AGENTS.md"));

  const baseDocument = ensureNoBaseContracts(buildImportedBaseDocument(name, role, agentsContent, candidates));
  const overrideDocument = ensureDeltaOverride(buildImportedOverrideDocument(project, repoName, contextContent));
  const result = attachReviewRequired(baseDocument, overrideDocument);
  const report = buildImportReport(candidates, result.baseDocument, result.overrideDocument);

  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, buildDocumentYaml(result.baseDocument), "utf8");
  await writeFile(overrideOutPath, buildDocumentYaml(result.overrideDocument), "utf8");
  await writeFile(reportOutPath, report, "utf8");

  return { outPath, overrideOutPath, reportOutPath };
}
