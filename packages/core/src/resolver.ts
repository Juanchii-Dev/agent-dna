import type { AgentDnaState, LayerId } from "./types";

export function resolveDna(
  base: AgentDnaState,
  activeLayers: Record<LayerId, boolean>,
  overrides: Record<LayerId, Partial<AgentDnaState>>
) {
  let resolved = { ...base };

  (Object.keys(activeLayers) as LayerId[]).forEach((layerId) => {
    if (activeLayers[layerId]) {
      resolved = { ...resolved, ...overrides[layerId] };
    }
  });

  return resolved;
}
