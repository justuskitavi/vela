import { sendHbar, type TransferResult } from "@/lib/hedera/transfer";
import { runPolicies, type PolicyResult } from "@/lib/policies/types";
import { AllowListPolicy } from "@/lib/policies/allowList";
import { SpendLimitPolicy } from "@/lib/policies/spendLimit";
import {
  DailyBudgetPolicy,
  recordSpend,
} from "@/lib/policies/dailyBudget";

const POLICIES = [AllowListPolicy, SpendLimitPolicy, DailyBudgetPolicy];

export interface PurchaseParams {
  toAccountId: string;
  amountHbar: number;
  vendorName?: string;
}

export interface PurchaseResult {
  executed: boolean;
  transfer: TransferResult | null;
  blockedBy: string | null;
  reason: string | null;
  policyResults: PolicyResult[];
  data?: Record<string, unknown>;
}

export async function purchaseFromVendor(
  params: PurchaseParams
): Promise<PurchaseResult> {
  const { toAccountId, amountHbar, vendorName } = params;

  const policyRun = await runPolicies(POLICIES, {
    toAccountId,
    amountHbar,
    vendorName,
  });

  if (!policyRun.allowed) {
    return {
      executed: false,
      transfer: null,
      blockedBy: policyRun.blockedBy?.policyName ?? null,
      reason: policyRun.blockedBy?.reason ?? null,
      policyResults: policyRun.results,
    };
  }

  const transfer = await sendHbar({
    toAccountId,
    amountHbar,
    memo: vendorName ? `Vela purchase: ${vendorName}` : "Vela purchase",
  });

  await recordSpend(amountHbar);

  return {
    executed: true,
    transfer,
    blockedBy: null,
    reason: null,
    policyResults: policyRun.results,
  };
}
