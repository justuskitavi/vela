"use client";

import type { PurchaseResult } from "@/app/types";

interface TransactionLogProps {
  entries: PurchaseResult[];
}

function shortAccount(id: string | undefined | null) {
  return id ?? "—";
}

export default function TransactionLog({ entries }: TransactionLogProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            color: "var(--accent)",
            letterSpacing: "0.05em",
            marginBottom: 4,
          }}
        >
          TRANSACTION LOG
        </div>
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
          Every purchase attempt, policy by policy
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
        {entries.length === 0 && (
          <div
            style={{
              fontSize: 13,
              color: "var(--text-dim)",
              fontFamily: "var(--font-mono)",
              padding: "24px 4px",
              textAlign: "center",
            }}
          >
            No purchase attempts yet.
            <br />
            Ask Vela for something.
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {entries
            .slice()
            .reverse()
            .map((entry, i) => (
              <TransactionEntry key={i} entry={entry} />
            ))}
        </div>
      </div>
    </div>
  );
}

function TransactionEntry({ entry }: { entry: PurchaseResult }) {
  const ok = entry.executed;

  return (
    <div
      style={{
        background: "var(--surface-raised)",
        border: `1px solid ${ok ? "var(--border-strong)" : "var(--danger)"}`,
        borderRadius: 10,
        padding: "14px 16px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            fontWeight: 600,
            color: ok ? "var(--accent)" : "var(--danger)",
          }}
        >
          <span
            style={{
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: ok ? "var(--accent)" : "var(--danger)",
              color: "#06150d",
              fontSize: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
            }}
          >
            {ok ? "check" : "x"}
          </span>
          {ok ? "Executed" : "Blocked"}
        </div>
        {ok && entry.transfer && (
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              color: "var(--text-muted)",
            }}
          >
            {entry.transfer.amountHbar} HBAR
          </span>
        )}
      </div>

      {ok && entry.transfer ? (
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11.5,
            color: "var(--text-muted)",
            lineHeight: 1.6,
            marginBottom: 10,
            wordBreak: "break-all",
          }}
        >
          <div>to {shortAccount(entry.transfer.toAccountId)}</div>
          <div style={{ color: "var(--text-dim)" }}>{entry.transfer.transactionId}</div>
        </div>
      ) : (
        <div
          style={{
            fontSize: 12.5,
            color: "var(--text)",
            marginBottom: 10,
            lineHeight: 1.5,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono)",
              color: "var(--danger)",
              fontSize: 11,
              display: "block",
              marginBottom: 3,
            }}
          >
            {entry.blockedBy}
          </span>
          {entry.reason}
        </div>
      )}

      {ok && entry.data && (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "10px 12px",
            marginBottom: 10,
            fontFamily: "var(--font-mono)",
            fontSize: 11.5,
            color: "var(--text)",
            lineHeight: 1.7,
          }}
        >
          {Object.entries(entry.data).map(([key, value]) => (
            <div key={key} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <span style={{ color: "var(--text-dim)" }}>{key}</span>
              <span style={{ textAlign: "right", wordBreak: "break-word" }}>
                {typeof value === "object" ? JSON.stringify(value) : String(value)}
              </span>
            </div>
          ))}
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
          paddingTop: 10,
          borderTop: "1px solid var(--border)",
        }}
      >
        {entry.policyResults.map((p) => (
          <div
            key={p.policyName}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11,
              fontFamily: "var(--font-mono)",
              color: p.allowed ? "var(--text-muted)" : "var(--danger)",
            }}
          >
            <span style={{ color: p.allowed ? "var(--accent)" : "var(--danger)" }}>
              {p.allowed ? "ok" : "no"}
            </span>
            {p.policyName}
          </div>
        ))}
      </div>
    </div>
  );
}
