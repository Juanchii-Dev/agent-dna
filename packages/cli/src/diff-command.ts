import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseImportedDocument, parseOverrideDocument } from "@tuwebai/core";
import { getDefaultDnaPath, readOptionalFile, resolveOverridePath } from "./cli-shared";

type DiffEntry = {
  path: string;
  before: string;
  after: string;
};

function stringifyValue(value: unknown) {
  return JSON.stringify(value);
}

function collectEntries(value: unknown, prefix = ""): Map<string, string> {
  if (Array.isArray(value)) {
    return new Map([[prefix, stringifyValue(value)]]);
  }

  if (value && typeof value === "object") {
    const objectEntries = Object.entries(value as Record<string, unknown>);
    if (objectEntries.length === 0) {
      return new Map([[prefix, stringifyValue(value)]]);
    }

    return objectEntries.reduce((accumulator, [key, nested]) => {
      const nextPrefix = prefix ? `${prefix}.${key}` : key;
      for (const [nestedKey, nestedValue] of collectEntries(nested, nextPrefix)) {
        accumulator.set(nestedKey, nestedValue);
      }
      return accumulator;
    }, new Map<string, string>());
  }

  return new Map([[prefix, stringifyValue(value)]]);
}

export function diffDocuments(before: unknown, after: unknown) {
  const beforeEntries = collectEntries(before);
  const afterEntries = collectEntries(after);
  const keys = [...new Set([...beforeEntries.keys(), ...afterEntries.keys()])].sort();

  return keys.reduce<DiffEntry[]>((entries, key) => {
    const previous = beforeEntries.get(key);
    const next = afterEntries.get(key);
    if (previous === next) {
      return entries;
    }

    entries.push({
      path: key || "$root",
      before: previous ?? "<missing>",
      after: next ?? "<missing>"
    });
    return entries;
  }, []);
}

export function formatDiff(entries: DiffEntry[]) {
  if (entries.length === 0) {
    return "Sin cambios";
  }

  return entries
    .map((entry) => [`${entry.path}`, `- ${entry.before}`, `+ ${entry.after}`].join("\n"))
    .join("\n\n");
}

async function resolveDocumentInput(input: string | null) {
  if (!input) {
    const defaultPath = getDefaultDnaPath();
    const content = await readOptionalFile(defaultPath);
    if (!content) {
      throw new Error("Falta archivo DNA");
    }

    return parseImportedDocument(content, defaultPath.toLowerCase());
  }

  const asFile = resolve(input);
  const directContent = await readOptionalFile(asFile);
  if (directContent) {
    try {
      return parseImportedDocument(directContent, asFile.toLowerCase());
    } catch {
      return parseOverrideDocument(directContent, asFile.toLowerCase());
    }
  }

  const overridePath = await resolveOverridePath(input);
  const overrideContent = await readFile(overridePath, "utf8");
  return parseOverrideDocument(overrideContent, overridePath.toLowerCase());
}

export async function buildDiffOutput(left: string | null, right: string | null) {
  const before = await resolveDocumentInput(left);
  const after = await resolveDocumentInput(right);
  return formatDiff(diffDocuments(before, after));
}
