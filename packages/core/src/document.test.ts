import { describe, expect, it } from "vitest";
import { normalizeDocument, syncDocumentWithState } from "./document";
import { initialDna, initialDnaDocument } from "./schema";

describe("document", () => {
  it("normaliza bloques completos sin perder estructura", () => {
    const normalized = normalizeDocument({
      ...initialDnaDocument,
      projects: [
        {
          id: " pulse ",
          name: " Pulse by TuWebAI ",
          repo: " dashboard-actual.tuwebai ",
          stack: [" React 18 ", "", "TypeScript"]
        }
      ],
      db_contracts: {
        ...initialDnaDocument.db_contracts,
        forbidden_fields: [" read ", "", "body"]
      },
      preferences: {
        tone: " direct, no fluff ",
        code_comments: " only when logic is non-obvious ",
        explanation_depth: " minimal unless asked ",
        ask_clarification: " max 1 question at a time "
      }
    });

    expect(normalized.projects?.[0].id).toBe("pulse");
    expect(normalized.projects?.[0].stack).toEqual(["React 18", "TypeScript"]);
    expect(normalized.db_contracts?.forbidden_fields).toEqual(["read", "body"]);
    expect(normalized.preferences?.tone).toBe("direct, no fluff");
  });

  it("sincroniza estado sin borrar projects, db_contracts ni custom", () => {
    const document = structuredClone(initialDnaDocument);
    document.custom = {
      ...document.custom,
      audit_tag: "rfc-v1"
    };

    const synced = syncDocumentWithState(
      {
        ...initialDna,
        name: "Juanchi actualizado",
        project: "Pulse Next"
      },
      document
    );

    expect(synced.identity.name).toBe("Juanchi actualizado");
    expect(synced.context?.active_project).toBe("Pulse Next");
    expect(synced.projects).toEqual(document.projects);
    expect(synced.db_contracts).toEqual(document.db_contracts);
    expect(synced.custom).toMatchObject({ audit_tag: "rfc-v1" });
  });
});
