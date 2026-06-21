import { getRedis } from "@/lib/redis";
import type { Policy, PolicyContext, PolicyResult } from "./types";

function getDailyBudgetHbar(): number {
  const raw = process.env.POLICY_DAILY_BUDGET_HBAR ?? "20";
  const parsed = Number(raw);
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error(
      `Invalid POLICY_DAILY_BUDGET_HBAR: "${raw}". Expected a positive number.`
    );
  }
  return parsed;
}


function getTodayKey(): string {
  const today = new Date().toISOString().slice(0, 10);
  return `daily-spend:${today}`;
}


function secondsUntilUtcMidnight(): number {
  const now = new Date();
  const midnight = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0,
      0,
      0
    )
  );
  return Math.ceil((midnight.getTime() - now.getTime()) / 1000);
}

async function getSpentToday(): Promise<number> {
  const redis = getRedis();
  const value = await redis.get<number>(getTodayKey());
  return value ?? 0;
}

export async function recordSpend(amountHbar: number): Promise<void> {
  const redis = getRedis();
  const key = getTodayKey();

 
  const current = await getSpentToday();
  const updated = current + amountHbar;

  await redis.set(key, updated, { ex: secondsUntilUtcMidnight() });
}

export const DailyBudgetPolicy: Policy = {
  name: "DailyBudgetPolicy",

  async evaluate(context: PolicyContext): Promise<PolicyResult> {
    const dailyBudget = getDailyBudgetHbar();
    const spentToday = await getSpentToday();
    const remaining = dailyBudget - spentToday;

    if (context.amountHbar > remaining) {
      return {
        allowed: false,
        policyName: this.name,
        reason: `Transfer of ${context.amountHbar} HBAR would exceed today's remaining budget of ${remaining} HBAR (daily cap: ${dailyBudget} HBAR, already spent: ${spentToday} HBAR).`,
      };
    }

    return {
      allowed: true,
      policyName: this.name,
      reason: `Transfer of ${context.amountHbar} HBAR is within today's remaining budget of ${remaining} HBAR.`,
    };
  },
};
