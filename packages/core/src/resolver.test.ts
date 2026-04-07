import { describe, expect, it } from "vitest";
import { initialDna } from "./schema";
import { resolveDna } from "./resolver";

describe("resolveDna", () => {
  it("aplica overrides activos", () => {
    const resolved = resolveDna(
      initialDna,
      { project: true, team: false },
      {
        project: { project: "Agent DNA", version: "v2.0.0" },
        team: { tone: "sobrio" }
      }
    );

    expect(resolved.project).toBe("Agent DNA");
    expect(resolved.version).toBe("v2.0.0");
    expect(resolved.tone).toBe(initialDna.tone);
  });
});
