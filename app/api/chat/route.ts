import { NextRequest, NextResponse } from "next/server";
import { runChatTurn } from "@/lib/agent/chat";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, requesterAccountId } = body;

    if (typeof message !== "string" || message.trim() === "") {
      return NextResponse.json(
        { error: "message is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    if (typeof requesterAccountId === "string" && requesterAccountId.trim() !== "") {
      console.log(`[chat] request from ${requesterAccountId.trim()}: "${message}"`);
    }

    const result = await runChatTurn(message);

    return NextResponse.json(result);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}