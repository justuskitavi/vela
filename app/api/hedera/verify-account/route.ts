import { NextRequest, NextResponse } from "next/server";
import { AccountBalanceQuery } from "@hashgraph/sdk";
import { getHederaClient } from "@/lib/hedera/client";

const ACCOUNT_ID_PATTERN = /^\d+\.\d+\.\d+$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accountId } = body;

    if (typeof accountId !== "string" || accountId.trim() === "") {
      return NextResponse.json(
        { error: "accountId is required and must be a string, e.g. 0.0.1234567" },
        { status: 400 }
      );
    }

    const trimmed = accountId.trim();

    if (!ACCOUNT_ID_PATTERN.test(trimmed)) {
      return NextResponse.json(
        { error: `"${trimmed}" is not a valid Hedera account ID. Expected the shape 0.0.xxxxxxx.` },
        { status: 400 }
      );
    }

    const client = getHederaClient();

    try {
      const balance = await new AccountBalanceQuery()
        .setAccountId(trimmed)
        .execute(client);

      return NextResponse.json({
        verified: true,
        accountId: trimmed,
        hbarBalance: balance.hbars.toString(),
      });
    } catch (queryError) {
      const message =
        queryError instanceof Error ? queryError.message : "Unknown error";

      if (
        message.includes("INVALID_ACCOUNT_ID") ||
        message.includes("ACCOUNT_DELETED")
      ) {
        return NextResponse.json({
          verified: false,
          accountId: trimmed,
          error: "This account does not exist on the network.",
        });
      }

      throw queryError;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}