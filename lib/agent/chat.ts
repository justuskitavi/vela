import { HumanMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";
import { getModel } from "./model";
import { buyDataTool } from "./tools";
import type { PurchaseResult } from "./purchase";

const SYSTEM_PROMPT = `You are Vela, an AI agent that can purchase data from approved vendors using HBAR on the Hedera network.

When a user asks for information that a vendor provides, use the buy_data tool — pass the vendor's id and a query extracted from the user's message (e.g. a city name, or a coin symbol). Every purchase is checked against spend policies — the tool may report that a purchase was blocked. If that happens, tell the user clearly why (e.g. spend limit, daily budget, or unapproved vendor) rather than pretending it succeeded.

If the purchase succeeds, the tool result includes a "data" field with the real information you paid for — report those actual values to the user, not a generic confirmation.

If the user's request doesn't match any available vendor, say so rather than calling the tool.`;

export interface ChatResult {
  reply: string;
  toolCalled: boolean;
  toolResult: PurchaseResult | null;
}

export async function runChatTurn(userMessage: string): Promise<ChatResult> {
  const model = getModel();
  const modelWithTools = model.bindTools([buyDataTool]);

  const messages = [
    new SystemMessage(SYSTEM_PROMPT),
    new HumanMessage(userMessage),
  ];

  const aiResponse = await modelWithTools.invoke(messages);

  const toolCalls = aiResponse.tool_calls ?? [];

  if (toolCalls.length === 0) {
    return {
      reply: typeof aiResponse.content === "string" ? aiResponse.content : "",
      toolCalled: false,
      toolResult: null,
    };
  }

  const call = toolCalls[0];
  const rawResult = await buyDataTool.invoke(
    call.args as { vendorId: string; query: string }
  );
  const toolResult = JSON.parse(rawResult as string);

  const toolMessage = new ToolMessage({
    content: rawResult as string,
    tool_call_id: call.id ?? "",
  });

  const followUp = await modelWithTools.invoke([
    ...messages,
    aiResponse,
    toolMessage,
  ]);

  return {
    reply: typeof followUp.content === "string" ? followUp.content : "",
    toolCalled: true,
    toolResult,
  };
}
