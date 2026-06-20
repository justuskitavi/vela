


import { NextRequest, NextResponse } from "next/server";
import { sendHbar } from "@/lib/hedera/transfer";
import { runPolicies } from "@/lib/policies/types";
import { AllowListPolicy } from "@/lib/policies/allowList";
import { SpendLimitPolicy } from "@/lib/policies/spendLimit";
import {
  DailyBudgetPolicy,
  recordSpend,
} from "@/lib/policies/dailyBudget";


const POLICIES = [AllowListPolicy, SpendLimitPolicy, DailyBudgetPolicy];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { toAccountId, amountHbar, vendorName } = body;

    if (typeof toAccountId !== "string" || toAccountId.trim() === "") {
      return NextResponse.json(
        { error: "toAccountId is required and must be a string, e.g. 0.0.1234567" },
        { status: 400 }
      );
    }

    if (typeof amountHbar !== "number" || amountHbar <= 0) {
      return NextResponse.json(
        { error: "amountHbar is required and must be a positive number" },
        { status: 400 }
      );
    }

    const policyContext = {
      toAccountId,
      amountHbar,
      vendorName: typeof vendorName === "string" ? vendorName : undefined,
    };

    const policyRun = await runPolicies(POLICIES, policyContext);

    if (!policyRun.allowed) {      
      return NextResponse.json(
        {
          executed: false,
          blockedBy: policyRun.blockedBy?.policyName,
          reason: policyRun.blockedBy?.reason,
          policyResults: policyRun.results,
        },
        { status: 200 }
      );
    }

    const transferResult = await sendHbar({
      toAccountId,
      amountHbar,
      memo: vendorName ? `Vela purchase: ${vendorName}` : "Vela purchase",
    });

    await recordSpend(amountHbar);

    return NextResponse.json({
      executed: true,
      transfer: transferResult,
      policyResults: policyRun.results,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
