import { parse } from "yaml";
import { normalizeDocument } from "./document";
import type { AgentDnaDocument, AgentDnaOverrideDocument, DnaIgnoreConfig } from "./types";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function mergeValues(base: unknown, override: unknown): unknown {
  if (override === undefined) {
    return base;
  }

  if (Array.isArray(override)) {
    return structuredClone(override);
  }

  if (isObject(base) && isObject(override)) {
    const next: Record<string, unknown> = { ...base };
    Object.keys(override).forEach((key) => {
      next[key] = mergeValues(base[key], override[key]);
    });
    return next;
  }

  return structuredClone(override);
}

function removePath(target: Record<string, unknown>, segments: string[]) {
  if (segments.length === 0) {
    return;
  }

  const [head, ...tail] = segments;
  if (!(head in target)) {
    return;
  }

  if (tail.length === 0) {
    delete target[head];
    return;
  }

  const next = target[head];
  if (isObject(next)) {
    removePath(next, tail);
  }
}

function stripUndefined(value: unknown): unknown {
  if (Array.isArray(value)) {
    const next = value.map(stripUndefined).filter((entry) => entry !== undefined);
    return next.length > 0 ? next : undefined;
  }

  if (!isObject(value)) {
    return value;
  }

  const next = Object.entries(value).reduce<Record<string, unknown>>((accumulator, [key, entry]) => {
    if (entry === undefined) {
      return accumulator;
    }

    const normalized = stripUndefined(entry);
    if (normalized === undefined) {
      return accumulator;
    }

    accumulator[key] = normalized;
    return accumulator;
  }, {});

  return Object.keys(next).length > 0 ? next : undefined;
}

export function mergeDnaDocuments(base: AgentDnaDocument, override?: AgentDnaOverrideDocument) {
  if (!override) {
    return normalizeDocument(base);
  }

  return normalizeDocument(mergeValues(base, override) as AgentDnaDocument);
}

export function parseOverrideDocument(content: string, fileName: string): AgentDnaOverrideDocument {
  const trimmed = content.trim();
  if (!fileName.endsWith(".json") && !fileName.endsWith(".yaml") && !fileName.endsWith(".yml")) {
    throw new Error("Formato no soportado. Usa .yaml, .yml o .json");
  }

  const raw = fileName.endsWith(".json") ? JSON.parse(trimmed) : parse(trimmed);
  if (!isObject(raw)) {
    throw new Error("Override invalido. Debe ser un objeto");
  }

  return raw as AgentDnaOverrideDocument;
}

export function parseDnaIgnore(content: string): DnaIgnoreConfig {
  const parsed = parse(content) as unknown;
  if (!isObject(parsed)) {
    throw new Error(".dnaignore invalido. Debe ser un objeto YAML");
  }

  return Object.entries(parsed).reduce<DnaIgnoreConfig>((accumulator, [tool, rules]) => {
    if (!Array.isArray(rules)) {
      throw new Error(`.dnaignore invalido en ${tool}. Debe ser una lista`);
    }

    accumulator[tool] = rules
      .filter((rule): rule is string => typeof rule === "string")
      .map((rule) => rule.trim())
      .filter(Boolean);

    return accumulator;
  }, {});
}

export function applyDnaIgnore(document: AgentDnaDocument, tool: string, config?: DnaIgnoreConfig) {
  if (!config || !config[tool]?.length) {
    return normalizeDocument(document);
  }

  const next = structuredClone(document) as Record<string, unknown>;
  config[tool].forEach((path) => {
    removePath(next, path.split(".").map((segment) => segment.trim()).filter(Boolean));
  });

  return stripUndefined(normalizeDocument(next as AgentDnaDocument)) as AgentDnaDocument;
}
