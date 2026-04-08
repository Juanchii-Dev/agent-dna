import type { AgentDnaState, LayerId, PlatformPreview } from "@agent-dna/core/browser";

export type NavTab = "landing" | "editor" | "marketplace";

export type Stat = { label: string; value: string };
export type Pillar = { title: string; text: string };
export type MarketplaceCard = { description: string; name: string; tag: string };
export type LayerPreset = {
  description: string;
  id: LayerId;
  label: string;
  overrides: Partial<AgentDnaState>;
};

export const initialDna: AgentDnaState = {
  alwaysRule: "usar PowerShell con ;",
  approvalMode: "owner_controlled",
  boundaryRule: "no mezclar contextos entre productos",
  business: "productos con IA para equipos",
  language: "es-AR",
  languageLabel: "espanol latino",
  languageRule: "responder en espanol latino",
  name: "Juanchi",
  neverRule: "usar any en TS",
  product: "Agent DNA",
  project: "Pulse",
  role: "Fullstack founder",
  secretPolicy: "never_expose",
  stack: "React, TypeScript, Supabase, Tailwind",
  tone: "directo, claro, sin relleno",
  version: "v1.4.2",
  visibility: "team",
};

export const stats: Stat[] = [
  { label: "Tiempo a contexto util", value: "2 min" },
  { label: "Repos sincronizados", value: "24" },
  { label: "Herramientas compatibles", value: "7" },
];

export const pillars: Pillar[] = [
  {
    title: "Una identidad, multiples clientes",
    text: "Claude, Codex, Cursor o Gemini arrancan con la misma base operacional y el mismo lenguaje.",
  },
  {
    title: "Governance real",
    text: "Scopes, capas y versiones para que el contexto correcto llegue al cliente correcto.",
  },
  {
    title: "Artefactos derivados",
    text: "Tu DNA canonico genera AGENTS.md, configs por plataforma y sync local sin drift silencioso.",
  },
];

export const marketplaceCards: MarketplaceCard[] = [
  {
    name: "Founder Operator",
    tag: "Top pick",
    description: "Pensado para founders tecnicos con varios repos, alto contexto y reglas de ejecucion duras.",
  },
  {
    name: "Laravel Lead",
    tag: "Backend",
    description: "Convenciones de arquitectura, testing y seguridad para equipos PHP con multiples productos.",
  },
  {
    name: "UX Systems Designer",
    tag: "Design",
    description: "Output visual consistente, tono de interfaz y criterios de handoff para productos complejos.",
  },
];

export const marketplaceTemplates: Record<string, Partial<AgentDnaState>> = {
  "Founder Operator": {
    alwaysRule: "usar PowerShell con ;",
    boundaryRule: "no mezclar contextos entre productos",
    business: "productos con IA para equipos pequenos",
    neverRule: "usar any en TS",
    project: "Pulse",
    role: "Fullstack founder",
    stack: "React, TypeScript, Supabase, Tailwind",
    tone: "directo, claro, sin relleno",
  },
  "Laravel Lead": {
    alwaysRule: "priorizar contratos y testing antes de refactors",
    boundaryRule: "no romper compatibilidad de APIs publicas",
    business: "plataformas de negocio con equipos backend",
    neverRule: "acoplar logica de dominio a controladores",
    project: "Core Platform",
    role: "Laravel lead",
    stack: "Laravel, PHP, MySQL, Redis",
    tone: "tecnico, firme, orientado a riesgo",
  },
  "UX Systems Designer": {
    alwaysRule: "priorizar claridad visual y consistencia sistemica",
    boundaryRule: "no introducir patrones visuales sin criterio de sistema",
    business: "productos digitales con multiples flujos de usuario",
    neverRule: "dejar estados sin definir",
    project: "Design System",
    role: "UX systems designer",
    stack: "Figma, Tokens, React, Storybook",
    tone: "claro, visual, orientado a decision",
  },
};

export const layerPresets: LayerPreset[] = [
  {
    id: "team",
    label: "Team DNA",
    description: "Estandares compartidos, seguridad y consistencia operativa.",
    overrides: {
      approvalMode: "team_review",
      business: "operacion coordinada entre multiples asistentes y repos",
      languageRule: "mantener consistencia de lenguaje entre herramientas",
      tone: "claro, sobrio, orientado a equipo",
      visibility: "team",
    },
  },
  {
    id: "project",
    label: "Project DNA",
    description: "Contexto del repo activo, stack y restricciones del producto.",
    overrides: {
      boundaryRule: "no mezclar Agent DNA con otros productos del workspace",
      business: "infraestructura portable de identidad para IAs",
      project: "Agent DNA",
      stack: "React, TypeScript, Supabase, MCP, CLI",
      version: "v2.0.0",
    },
  },
];
