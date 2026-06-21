"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import type { ChatMessage, ChatResult, PurchaseResult } from "@/app/types";

interface ChatPanelProps {
  connectedAccountId: string;
  onPurchase: (result: PurchaseResult) => void;
}

export default function ChatPanel({ connectedAccountId, onPurchase }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "intro",
      role: "assistant",
      content:
        "I'm Vela. Ask me for data — weather, crypto prices — and I'll purchase it from an approved vendor using HBAR, subject to spend policies.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, loading]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, requesterAccountId: connectedAccountId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Something went wrong.");
      }

      const result = data as ChatResult;

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: result.reply || "(no response)",
        },
      ]);

      if (result.toolResult) {
        onPurchase(result.toolResult);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Request failed.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "20px 28px", borderBottom: "1px solid var(--border)" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            color: "var(--accent)",
            letterSpacing: "0.05em",
            marginBottom: 4,
          }}
        >
          <Image
            src="/favicon.ico"
            alt=""
            width={13}
            height={13}
            style={{
              width: "auto",
              height: "1em",
              objectFit: "contain",
              filter: "drop-shadow(0 0 8px rgba(61, 220, 132, 0.34))",
            }}
          />
          <span>VELA</span>
        </div>
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
          Policy-governed purchasing agent · Hedera testnet
        </div>
        <div
          style={{
            fontSize: 12,
            color: "var(--text-dim)",
            fontFamily: "var(--font-mono)",
            marginTop: 4,
          }}
        >
          connected as {connectedAccountId}
        </div>
      </div>

      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px 28px",
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: m.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "var(--text-dim)",
                marginBottom: 4,
                fontFamily: "var(--font-mono)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {m.role === "user" ? "you" : "vela"}
            </div>
            <div
              style={{
                maxWidth: "85%",
                padding: "10px 14px",
                borderRadius: 10,
                fontSize: 14,
                lineHeight: 1.55,
                background: m.role === "user" ? "var(--accent-bg)" : "var(--surface)",
                border: `1px solid ${m.role === "user" ? "var(--accent-dim)" : "var(--border)"}`,
                color: "var(--text)",
                whiteSpace: "pre-wrap",
              }}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: 11,
                color: "var(--text-dim)",
                marginBottom: 4,
                fontFamily: "var(--font-mono)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              vela
            </div>
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                fontSize: 14,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--text-muted)",
                fontFamily: "var(--font-mono)",
              }}
            >
              thinking…
            </div>
          </div>
        )}

        {error && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              fontSize: 13,
              background: "var(--danger-bg)",
              border: "1px solid var(--danger)",
              color: "var(--danger)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {error}
          </div>
        )}
      </div>

      <div
        style={{
          padding: "16px 28px 24px",
          borderTop: "1px solid var(--border)",
          display: "flex",
          gap: 10,
          alignItems: "flex-end",
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Vela for data…"
          rows={1}
          style={{
            flex: 1,
            resize: "none",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "10px 12px",
            color: "var(--text)",
            fontSize: 14,
            outline: "none",
            maxHeight: 120,
          }}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          style={{
            background: "var(--accent)",
            color: "#06150d",
            border: "none",
            borderRadius: 8,
            padding: "10px 18px",
            fontSize: 14,
            fontWeight: 600,
            cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            opacity: loading || !input.trim() ? 0.5 : 1,
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
