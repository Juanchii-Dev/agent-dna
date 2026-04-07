import { stringify } from "yaml";
import { initialDna, initialDnaDocument } from "./schema";
import type { AgentDnaDocument } from "./types";
import type { AgentDnaState, LegacyAgentDnaDocument } from "./types";

function normalizeList(values?: string[]) {
  return (values ?? [])
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

function normalizeStack(stack: string[] | string | undefined) {
  if (Array.isArray(stack)) {
    return normalizeList(stack);
  }

  if (typeof stack === "string") {
    return normalizeList(stack.split(",").map((item) => item.trim()));
  }

  return [];
}

function normalizeProjects(projects?: AgentDnaDocument["projects"]) {
  return (projects ?? [])
    .filter((project) => typeof project.id === "string" && project.id.trim().length > 0)
    .map((project) => ({
      ...project,
      id: project.id.trim(),
      name: project.name.trim(),
      repo: project.repo?.trim(),
      rules_file: project.rules_file?.trim(),
      stack: normalizeList(project.stack)
    }));
}

function normalizeDbContracts(dbContracts?: AgentDnaDocument["db_contracts"]) {
  if (!dbContracts) {
    return undefined;
  }

  return {
    tables: dbContracts.tables,
    valid_notification_types: normalizeList(dbContracts.valid_notification_types),
    valid_notification_categories: normalizeList(dbContracts.valid_notification_categories),
    forbidden_fields: normalizeList(dbContracts.forbidden_fields)
  };
}

function normalizePreferences(preferences?: AgentDnaDocument["preferences"]) {
  if (!preferences) {
    return undefined;
  }

  return {
    tone: preferences.tone?.trim(),
    code_comments: preferences.code_comments?.trim(),
    explanation_depth: preferences.explanation_depth?.trim(),
    ask_clarification: preferences.ask_clarification?.trim()
  };
}

export function normalizeDocument(document: AgentDnaDocument): AgentDnaDocument {
  return {
    ...document,
    identity: {
      ...document.identity,
      name: document.identity.name.trim(),
      role: document.identity.role.trim(),
      timezone: document.identity.timezone?.trim(),
      language: document.identity.language?.trim(),
      output_language: document.identity.output_language?.trim()
    },
    stack: {
      primary: normalizeList(document.stack.primary),
      backend: normalizeList(document.stack.backend),
      tools: normalizeList(document.stack.tools),
      avoid: normalizeList(document.stack.avoid)
    },
    rules: document.rules
      ? {
          always: normalizeList(document.rules.always),
          never: normalizeList(document.rules.never),
          formatting: normalizeList(document.rules.formatting)
        }
      : undefined,
    context: document.context
      ? {
          active_project: document.context.active_project?.trim(),
          active_sprint: document.context.active_sprint?.trim(),
          os: document.context.os?.trim(),
          shell: document.context.shell?.trim()
        }
      : undefined,
    projects: normalizeProjects(document.projects),
    db_contracts: normalizeDbContracts(document.db_contracts),
    preferences: normalizePreferences(document.preferences),
    custom: structuredClone(document.custom ?? {})
  };
}

export function normalizeLegacyDocument(document: LegacyAgentDnaDocument): AgentDnaDocument {
  const dna = document.agent_dna;

  return normalizeDocument({
    version: "1.0",
    identity: {
      name: dna.identity.name,
      role: dna.identity.role,
      output_language: dna.preferences?.language?.startsWith("es") ? "es" : undefined
    },
    stack: {
      primary: normalizeStack(dna.identity.stack)
    },
    rules: {
      always: normalizeList(dna.rules.always),
      never: normalizeList(dna.rules.never)
    },
    context: {
      active_project: dna.context?.active_project
    },
    preferences: {
      tone: dna.preferences?.tone
    },
    custom: {
      legacy_meta: dna.meta,
      policy: dna.policy,
      business: dna.context?.business,
      imported_from: "legacy-agent_dna"
    }
  });
}

export function mapDocumentToState(document: AgentDnaDocument): AgentDnaState {
  const normalized = normalizeDocument(document);
  const rulesAlways = normalizeList(normalized.rules?.always);
  const rulesNever = normalizeList(normalized.rules?.never);
  const stack = normalizeList([
    ...normalized.stack.primary,
    ...normalizeList(normalized.stack.backend),
    ...normalizeList(normalized.stack.tools)
  ]);

  return {
    ...initialDna,
    alwaysRule: rulesAlways[0] ?? initialDna.alwaysRule,
    approvalMode:
      typeof document.custom?.policy === "object" &&
      document.custom.policy !== null &&
      "approval_mode" in document.custom.policy &&
      typeof document.custom.policy.approval_mode === "string"
        ? document.custom.policy.approval_mode
        : initialDna.approvalMode,
    boundaryRule: rulesNever[1] ?? rulesNever[0] ?? initialDna.boundaryRule,
    business:
      (typeof normalized.custom?.business === "string" ? normalized.custom.business : undefined) ?? initialDna.business,
    language: normalized.identity.output_language ?? initialDna.language,
    languageLabel: initialDna.languageLabel,
    languageRule: rulesAlways[3] ?? rulesAlways[1] ?? initialDna.languageRule,
    name: normalized.identity.name,
    neverRule: rulesNever[0] ?? initialDna.neverRule,
    product: initialDna.product,
    project: normalized.context?.active_project ?? initialDna.project,
    role: normalized.identity.role,
    secretPolicy:
      typeof normalized.custom?.policy === "object" &&
      normalized.custom.policy !== null &&
      "secret_policy" in normalized.custom.policy &&
      typeof normalized.custom.policy.secret_policy === "string"
        ? normalized.custom.policy.secret_policy
        : initialDna.secretPolicy,
    stack: stack.join(", "),
    tone: normalized.preferences?.tone ?? initialDna.tone,
    version: normalized.version,
    visibility:
      typeof normalized.custom?.legacy_meta === "object" &&
      normalized.custom.legacy_meta !== null &&
      "visibility" in normalized.custom.legacy_meta &&
      typeof normalized.custom.legacy_meta.visibility === "string"
        ? normalized.custom.legacy_meta.visibility
        : initialDna.visibility
  };
}

export function syncDocumentWithState(state: AgentDnaState, baseDocument?: AgentDnaDocument): AgentDnaDocument {
  const base = normalizeDocument(structuredClone(baseDocument ?? initialDnaDocument));
  const rulesAlways = normalizeList(base.rules?.always);
  const rulesNever = normalizeList(base.rules?.never);
  const primaryStack = normalizeStack(base.stack.primary).length > 0 ? normalizeStack(base.stack.primary) : normalizeStack(state.stack);

  rulesAlways[0] = state.alwaysRule;
  rulesAlways[3] = state.languageRule;
  rulesNever[0] = state.neverRule;
  rulesNever[1] = state.boundaryRule;

  base.version = state.version || initialDnaDocument.version;
  base.identity.name = state.name;
  base.identity.role = state.role;
  base.identity.output_language = state.language;
  base.stack.primary = primaryStack;
  base.rules = {
    ...base.rules,
    always: rulesAlways.filter(Boolean),
    never: rulesNever.filter(Boolean)
  };
  base.context = {
    ...base.context,
    active_project: state.project
  };
  base.preferences = {
    ...base.preferences,
    tone: state.tone
  };
  base.custom = {
    ...base.custom,
    business: state.business,
    policy: {
      approval_mode: state.approvalMode,
      secret_policy: state.secretPolicy
    },
    visibility: state.visibility
  };

  return normalizeDocument(base);
}

export function buildDocumentJson(document: AgentDnaDocument) {
  return JSON.stringify(document, null, 2);
}

export function buildDocumentYaml(document: AgentDnaDocument) {
  return stringify(document, { lineWidth: 0 });
}
