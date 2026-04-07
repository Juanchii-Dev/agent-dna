import { describe, expect, it } from "vitest";
import { diffDocuments, formatDiff } from "./diff-command";

describe("diff-command", () => {
  it("detecta cambios por ruta", () => {
    const output = diffDocuments(
      { identity: { role: "Founder" }, stack: { primary: ["React"] } },
      { identity: { role: "CTO" }, stack: { primary: ["React", "TypeScript"] } }
    );

    expect(output).toEqual([
      {
        path: "identity.role",
        before: "\"Founder\"",
        after: "\"CTO\""
      },
      {
        path: "stack.primary",
        before: "[\"React\"]",
        after: "[\"React\",\"TypeScript\"]"
      }
    ]);
  });

  it("formatea sin cambios", () => {
    expect(formatDiff([])).toBe("Sin cambios");
  });
});
