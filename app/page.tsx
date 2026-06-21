"use client";

import { useState } from "react";
import ConnectScreen from "@/app/components/ConnectScreen";
import ChatPanel from "@/app/components/ChatPanel";
import TransactionLog from "@/app/components/TransactionLog";
import type { PurchaseResult } from "@/app/types";

export default function Home() {
  const [connectedAccountId, setConnectedAccountId] = useState<string | null>(null);
  const [entries, setEntries] = useState<PurchaseResult[]>([]);

  function handlePurchase(result: PurchaseResult) {
    setEntries((prev) => [...prev, result]);
  }

  if (!connectedAccountId) {
    return <ConnectScreen onConnect={setConnectedAccountId} />;
  }

  return (
    <main
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 380px",
        height: "100vh",
      }}
    >
      <section
        style={{
          borderRight: "1px solid var(--border)",
          minWidth: 0,
        }}
      >
        <ChatPanel connectedAccountId={connectedAccountId} onPurchase={handlePurchase} />
      </section>

      <aside style={{ minWidth: 0, background: "var(--surface)" }}>
        <TransactionLog entries={entries} />
      </aside>
    </main>
  );
}
