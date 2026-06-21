export interface PolicyResult {
  allowed: boolean;
  policyName: string;
  reason: string;
}

export interface TransferResult {
  success: boolean;
  transactionId: string;
  status: string;
  fromAccountId: string;
  toAccountId: string;
  amountHbar: number;
}

export interface PurchaseResult {
  executed: boolean;
  transfer: TransferResult | null;
  blockedBy: string | null;
  reason: string | null;
  policyResults: PolicyResult[];
  data?: Record<string, unknown>;
}

export interface ChatResult {
  reply: string;
  toolCalled: boolean;
  toolResult: PurchaseResult | null;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}
