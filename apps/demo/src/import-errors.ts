import type { ImportIssue } from "@tuwebai/core/browser";

const pathToField: Record<string, string> = {
  "agent_dna.context.active_project": "project",
  "agent_dna.context.business": "business",
  "agent_dna.identity.name": "name",
  "agent_dna.identity.role": "role",
  "agent_dna.identity.stack": "stack",
  "agent_dna.meta.schema_version": "schemaVersion",
  "agent_dna.policy.approval_mode": "approvalMode",
  "agent_dna.policy.secret_policy": "secretPolicy",
  "agent_dna.preferences.language": "language",
  "agent_dna.preferences.tone": "tone",
  "agent_dna.rules.always": "alwaysRule",
  "agent_dna.rules.never": "neverRule",
};

export function mapImportIssuesToFields(issues: ImportIssue[]) {
  return issues.reduce<Partial<Record<string, string>>>((accumulator, issue) => {
    const field = pathToField[issue.path];
    if (!field || accumulator[field]) {
      return accumulator;
    }

    const message = issue.message.includes(":")
      ? issue.message.split(":").slice(1).join(":").trim()
      : issue.message;

    accumulator[field] = message;
    if (field === "neverRule" && !accumulator.boundaryRule) {
      accumulator.boundaryRule = message;
    }
    return accumulator;
  }, {});
}
