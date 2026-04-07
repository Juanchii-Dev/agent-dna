import { describe, expect, it } from "vitest";
import { mapImportedDnaToState, parseImportedDocument, parseImportedDna } from "./parser";

const validRaw = {
  version: "1.0",
  identity: {
    name: "Juanchi",
    role: "Fullstack Founder",
    language: "es-419",
    output_language: "es"
  },
  stack: {
    primary: ["TypeScript", "React", "Supabase", "Tailwind"],
    backend: ["PostgreSQL"],
    tools: ["PowerShell"],
    avoid: ["any"]
  },
  rules: {
    always: ["usar PowerShell con ;", "responder en espanol latino"],
    never: ["usar any en TS", "no mezclar productos"],
    formatting: ["sin preambulos"]
  },
  context: {
    active_project: "Pulse",
    active_sprint: "ARQ",
    os: "Windows 10",
    shell: "PowerShell"
  },
  preferences: {
    tone: "directo"
  }
};

const legacyRaw = {
  agent_dna: {
    meta: {
      schema_version: "0.1.0",
      dna_version: "1.0.0",
      visibility: "team"
    },
    identity: {
      name: "Juanchi",
      role: "Founder",
      stack: ["React", "TypeScript"]
    },
    preferences: {
      language: "es-AR",
      tone: "directo"
    },
    rules: {
      always: ["usar PowerShell con ;"],
      never: ["usar any en TS", "no mezclar productos"]
    },
    context: {
      active_project: "Pulse",
      business: "productos con IA"
    },
    policy: {
      secret_policy: "never_expose",
      approval_mode: "owner_controlled"
    }
  }
};

describe("parser", () => {
  it("mapea documento v1 valido a estado", () => {
    const state = mapImportedDnaToState(validRaw);
    expect(state.name).toBe("Juanchi");
    expect(state.stack).toContain("TypeScript");
  });

  it("rechaza version no soportada", () => {
    expect(() =>
      mapImportedDnaToState({
        ...validRaw,
        version: "2.0"
      })
    ).toThrow("schema_version no soportado");
  });

  it("rechaza propiedades extra fuera del contrato", () => {
    expect(() =>
      mapImportedDnaToState({
        ...validRaw,
        identity: {
          ...validRaw.identity,
          nickname: "Juanchi"
        }
      })
    ).toThrow("propiedad no permitida");
  });

  it("rechaza stack.primary vacio", () => {
    expect(() =>
      mapImportedDnaToState({
        ...validRaw,
        stack: {
          ...validRaw.stack,
          primary: []
        }
      })
    ).toThrow("debe incluir al menos un elemento");
  });

  it("parsea yaml v1 valido", () => {
    const yaml = `version: "1.0"
identity:
  name: "Juanchi"
  role: "Fullstack Founder"
  output_language: "es"
stack:
  primary:
    - "TypeScript"
    - "React"
rules:
  always:
    - "usar PowerShell con ;"
  never:
    - "usar any en TS"
context:
  active_project: "Pulse"
preferences:
  tone: "directo"`;

    const state = parseImportedDna(yaml, "agent-dna.yaml");
    expect(state.project).toBe("Pulse");
  });

  it("preserva arrays reales del documento importado", () => {
    const yaml = `version: "1.0"
identity:
  name: "Juanchi"
  role: "Fullstack Founder"
stack:
  primary:
    - "TypeScript"
    - "React"
  backend:
    - "Supabase"
rules:
  always:
    - "usar PowerShell con ;"
    - "responder en espanol latino"
    - "priorizar contexto de negocio"
  never:
    - "usar any en TS"
    - "no mezclar productos"
preferences:
  tone: "directo"`;

    const document = parseImportedDocument(yaml, "agent-dna.yaml");
    expect(document.rules?.always).toHaveLength(3);
    expect(document.stack.backend).toEqual(["Supabase"]);
  });

  it("acepta shape legado y lo normaliza al spec", () => {
    const document = parseImportedDocument(JSON.stringify(legacyRaw), "agent-dna.json");
    expect(document.version).toBe("1.0");
    expect(document.identity.name).toBe("Juanchi");
    expect(document.custom?.imported_from).toBe("legacy-agent_dna");
  });
});
