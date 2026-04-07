import type { AgentDnaDocument, AgentDnaState } from "./types";

export const initialDna: AgentDnaState = {
  alwaysRule: "Separar comandos de PowerShell con `;` y no con `&&`",
  approvalMode: "owner_controlled",
  boundaryRule: "Mix projects Captiva and TuWebAI in the same codebase or copy",
  business: "productos con IA para equipos",
  language: "es",
  languageLabel: "espanol latino",
  languageRule: "Output in Latino Spanish with correct tildes",
  name: "Juanchi",
  neverRule: "Use `any` type in TypeScript",
  product: "Agent DNA",
  project: "Pulse",
  role: "Fullstack Founder",
  secretPolicy: "never_expose",
  stack: "TypeScript, React 18, Vite, Tailwind CSS",
  tone: "direct, no fluff",
  version: "1.0",
  visibility: "team"
};

export const initialDnaDocument: AgentDnaDocument = {
  version: "1.0",
  identity: {
    name: initialDna.name,
    role: initialDna.role,
    experience_years: 6,
    timezone: "America/Argentina/Cordoba",
    language: "es-419",
    output_language: "es"
  },
  stack: {
    primary: ["TypeScript", "React 18", "Vite", "Tailwind CSS"],
    backend: ["Supabase", "PostgreSQL", "Express"],
    tools: ["Git", "PowerShell"],
    avoid: ["Redux", "any"]
  },
  rules: {
    never: [
      "Use `any` type in TypeScript",
      "Expose service_role key to client",
      "Use && to chain PowerShell commands — always use ;",
      "Mix projects Captiva and TuWebAI in the same codebase or copy"
    ],
    always: [
      "Separate PowerShell commands with `;` not `&&`",
      "Audit real schema and files before suggesting changes",
      "One slice at a time — no parallel changes",
      "Output in Latino Spanish with correct tildes"
    ],
    formatting: [
      "No preambles, no closers, no narration",
      "Action first",
      "Max 2 sentences for conversational answers"
    ]
  },
  context: {
    active_project: initialDna.project,
    active_sprint: "ARQ",
    os: "Windows 10",
    shell: "PowerShell"
  },
  projects: [
    {
      id: "pulse",
      name: "Pulse by TuWebAI",
      repo: "dashboard-actual.tuwebai",
      stack: ["React 18", "TypeScript", "Vite", "Tailwind", "Supabase"],
      rules_file: "~/.agent-dna/overrides/pulse.yaml"
    },
    {
      id: "tuwebai",
      name: "TuWebAI",
      repo: "Tuwebai",
      stack: ["React 18", "TypeScript", "Vite", "Tailwind", "Firebase", "Express"]
    }
  ],
  db_contracts: {
    tables: {
      users: "not `profiles`",
      projects: {
        created_by: "not `user_id`"
      },
      pulse_metrics: {
        metric_date: "not `date`"
      }
    },
    valid_notification_types: ["info", "success", "warning", "error", "critical"],
    valid_notification_categories: ["system", "project", "ticket", "payment", "security", "user"],
    forbidden_fields: ["read", "body", "new_consultation", "monthly_summary", "project_update"]
  },
  preferences: {
    tone: "direct, no fluff",
    code_comments: "only when logic is non-obvious",
    explanation_depth: "minimal unless asked",
    ask_clarification: "max 1 question at a time"
  }
};
