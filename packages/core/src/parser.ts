import Ajv2020, { type ErrorObject } from "ajv/dist/2020.js";
import { parse } from "yaml";
import { mapDocumentToState, normalizeLegacyDocument } from "./document";
import type { AgentDnaDocument, AgentDnaState, LegacyAgentDnaDocument } from "./types";
import agentDnaSchema from "../schema/agent-dna.schema.json";

type ParsedAgentDna = Partial<AgentDnaDocument> | Partial<LegacyAgentDnaDocument>;

const ajv = new Ajv2020({ allErrors: true, strict: false });
const validateSchema = ajv.compile(agentDnaSchema);
const supportedSchemaVersion = "1.0";

export type ImportIssue = {
  path: string;
  message: string;
};

export class AgentDnaImportError extends Error {
  issues: ImportIssue[];

  constructor(message: string, issues: ImportIssue[] = []) {
    super(message);
    this.name = "AgentDnaImportError";
    this.issues = issues;
  }
}

function formatSchemaPath(error: ErrorObject) {
  const basePath = error.instancePath.replaceAll("/", ".").replace(/^\./, "");
  const missingProperty =
    error.keyword === "required" && typeof error.params.missingProperty === "string"
      ? error.params.missingProperty
      : "";

  if (!basePath && !missingProperty) {
    return "raiz";
  }

  if (!basePath) {
    return missingProperty;
  }

  return missingProperty ? `${basePath}.${missingProperty}` : basePath;
}

function formatSchemaError(error: ErrorObject) {
  const path = formatSchemaPath(error);

  switch (error.keyword) {
    case "additionalProperties":
      return `${path}: propiedad no permitida`;
    case "const":
      return `${path}: version no soportada`;
    case "minLength":
      return `${path}: no puede estar vacio`;
    case "minItems":
      return `${path}: debe incluir al menos un elemento`;
    case "required":
      return `${path}: campo obligatorio`;
    case "type":
      return `${path}: tipo invalido`;
    default:
      return `${path}: ${error.message ?? "valor invalido"}`;
  }
}

function throwImportError(message: string, issues: ImportIssue[] = []): never {
  throw new AgentDnaImportError(message, issues);
}

function isLegacyDocument(raw: ParsedAgentDna): raw is LegacyAgentDnaDocument {
  return typeof raw === "object" && raw !== null && "agent_dna" in raw;
}

function validateV1Document(raw: unknown): AgentDnaDocument {
  const document = raw as AgentDnaDocument;

  if (typeof document.version === "string" && document.version !== supportedSchemaVersion) {
    throwImportError(`schema_version no soportado. Usa ${supportedSchemaVersion}`, [
      { path: "version", message: `Version no soportada. Usa ${supportedSchemaVersion}` }
    ]);
  }

  if (!validateSchema(document)) {
    const issues = (validateSchema.errors ?? []).map((error) => ({
      path: formatSchemaPath(error),
      message: formatSchemaError(error)
    }));
    const details = issues.map((issue) => issue.message).join(" | ");
    throwImportError(`agent_dna invalido: ${details}`, issues);
  }

  return document;
}

export function validateImportedDna(raw: unknown) {
  return validateImportedDocument(raw);
}

export function validateImportedDocument(raw: unknown): AgentDnaDocument {
  const parsed = raw as ParsedAgentDna;

  if (isLegacyDocument(parsed)) {
    return normalizeLegacyDocument(parsed);
  }

  return validateV1Document(parsed);
}

export function mapImportedDnaToState(raw: unknown): AgentDnaState {
  return mapDocumentToState(validateImportedDocument(raw));
}

export function parseImportedDna(content: string, fileName: string): AgentDnaState {
  return mapDocumentToState(parseImportedDocument(content, fileName));
}

export function parseImportedDocument(content: string, fileName: string): AgentDnaDocument {
  const trimmed = content.trim();
  if (!fileName.endsWith(".json") && !fileName.endsWith(".yaml") && !fileName.endsWith(".yml")) {
    throw new Error("Formato no soportado. Usa .yaml, .yml o .json");
  }

  const raw = fileName.endsWith(".json") ? JSON.parse(trimmed) : parse(trimmed);
  return validateImportedDocument(raw);
}

export const schemaMetadata = {
  id: agentDnaSchema.$id,
  title: agentDnaSchema.title,
  version: supportedSchemaVersion
};
