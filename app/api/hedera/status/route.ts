import { NextResponse } from "next/server";
import  { AccountBalanceQuery } from "@hashgraph/sdk";
import { getHederaClient, getOperatorAccountId } from "@/lib/hedera/client";
import { getHederaConfig } from "@/lib/hedera/config";

export async function GET() {
    try {
        const config = getHederaConfig()
        const client = getHederaClient()
        const accountId = getOperatorAccountId()

        const balance  = await new AccountBalanceQuery()
        .setAccountId(accountId)
        .execute(client)

        return NextResponse.json({
            connected: true,
            network: config.network, 
            accountId,
            hbarBalance: balance.hbars.toString(),
        })
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error"
        return NextResponse.json({
            connected: false,
            error: message,
        },
        { status: 500 }          
        )
    }

}