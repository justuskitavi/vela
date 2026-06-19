import { NextRequest, NextResponse } from "next/server";
import { sendHbar } from "@/lib/hedera/transfer";

export  async function POST(request: NextRequest){
    try {
        const body = await request.json()
        const { toAccountId, amountHbar, memo } = body 
        if (typeof toAccountId !== "string" || toAccountId.trim() === ""){
            return NextResponse.json({
                error: "toAccount id is required and must be a string.",
            },
            {
                status: 400
            }
        )
        }

        if (typeof amountHbar !== "number" || amountHbar <= 0){
            return NextResponse.json(
                {
                    error: "Amount must be a number that is greater than 0",
                },
                {
                    status: 400
                }
            )
        }

        const result = await sendHbar({
            toAccountId, 
            amountHbar, 
            memo: typeof memo === "string" ? memo : undefined,
        })

        return NextResponse.json(result)
    } catch(error) {
        const message = error instanceof Error ? error.message: "Unknown error just occured"

        return NextResponse.json(
            {
                error: message,
            },
            {
                status: 500
            }
        )
    }
}