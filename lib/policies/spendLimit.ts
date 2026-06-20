import type { Policy, PolicyContext, PolicyResult } from "./types";

function getMaxHbarPerTransfer(): number {
  const raw = process.env.POLICY_MAX_HBAR_PER_TRANSFER ?? "5";
  const parsed = Number(raw);
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error(
      `Invalid POLICY_MAX_HBAR_PER_TRANSFER: "${raw}". Expected a positive number.`
    );
  }
  return parsed;
}

export const SpendLimitPolicy: Policy = {
  name: "SpendLimitPolicy",

  async evaluate(context: PolicyContext): Promise<PolicyResult> {
    const maxPerTransfer = getMaxHbarPerTransfer();

    if (context.amountHbar > maxPerTransfer) {
      return {
        allowed: false,
        policyName: this.name,
        reason: `Transfer of ${context.amountHbar} HBAR exceeds the per-transaction limit of ${maxPerTransfer} HBAR.`,
      };
    }

    return {
      allowed: true,
      policyName: this.name,
      reason: `Transfer of ${context.amountHbar} HBAR is within the ${maxPerTransfer} HBAR per-transaction limit.`,
    };
  },
};