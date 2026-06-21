"use client";

import Image from "next/image";
import { useState } from "react";
import styles from "./ConnectScreen.module.css";

interface ConnectScreenProps {
  onConnect: (accountId: string) => void;
}

export default function ConnectScreen({ onConnect }: ConnectScreenProps) {
  const [stage, setStage] = useState<"welcome" | "form">("welcome");
  const [accountId, setAccountId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConnect() {
    const trimmed = accountId.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/hedera/verify-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: trimmed }),
      });

      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        throw new Error(`Unexpected server response (${response.status}).`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Verification failed.");
      }

      if (!data.verified) {
        setError(data.error ?? "This account does not exist on the network.");
        return;
      }

      onConnect(data.accountId);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Connection failed.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleConnect();
    }
  }

  if (stage === "welcome") {
    return (
      <main className={styles.shell}>
        <section className={styles.welcome}>
          <nav className={styles.nav} aria-label="Vela">
            <BrandLockup />
            <div className={styles.networkPill}>Hedera testnet · policy wallet</div>
          </nav>

          <div className={styles.hero}>
            <div className={styles.intro}>
              <div className={styles.heroLogo} aria-hidden="true">
                <Image
                  src="/favicon.ico"
                  alt=""
                  width={58}
                  height={58}
                  className={styles.heroLogoImage}
                />
                <div className={styles.heroLogoGlow} />
              </div>
              <div className={styles.kicker}>
                <span className={styles.pulse} />
                autonomous data purchasing
              </div>
              <h1 className={styles.title}>Vela buys data with rules you can see.</h1>
              <p className={styles.sentence}>
                Vela is a policy-governed AI agent that pays approved vendors in HBAR for live data.
              </p>

              <div className={styles.actions}>
                <button className={styles.primaryButton} onClick={() => setStage("form")}>
                  Get started
                </button>
                <span className={styles.microcopy}>No wallet signature · account ID only</span>
              </div>

              <div className={styles.metrics} aria-label="Vela policy controls">
                <div className={styles.metric}>
                  <div className={styles.metricValue}>01</div>
                  <div className={styles.metricLabel}>Vendor must be on the allowlist.</div>
                </div>
                <div className={styles.metric}>
                  <div className={styles.metricValue}>02</div>
                  <div className={styles.metricLabel}>Every purchase respects the spend cap.</div>
                </div>
                <div className={styles.metric}>
                  <div className={styles.metricValue}>03</div>
                  <div className={styles.metricLabel}>Transactions land on Hedera testnet.</div>
                </div>
              </div>
            </div>

            <div className={styles.visual} aria-hidden="true">
              <div className={styles.ledger}>
                <FlowStep code="AI" title="Request" detail="Weather or crypto price intent is turned into a vendor purchase." />
                <FlowStep code="OK" title="Policy check" detail="Allowlist, transaction limit, and daily budget run before funds move." />
                <FlowStep code="HB" title="Payment" detail="Vela pays from its operator wallet, then returns the vendor data." />

                <div className={styles.transaction}>
                  <div className={styles.transactionRow}>
                    <span>vendor</span>
                    <span className={styles.transactionStrong}>weather.api</span>
                  </div>
                  <div className={styles.transactionRow}>
                    <span>amount</span>
                    <span>0.05 HBAR</span>
                  </div>
                  <div className={styles.transactionRow}>
                    <span>status</span>
                    <span className={styles.transactionStrong}>approved</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <footer className={styles.footer}>
            <span>Real vendor calls</span>
            <span>Visible policy decisions</span>
            <span>Operator-funded payments</span>
          </footer>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.shell}>
      <div className={styles.formWrap}>
        <div className={styles.formPanel}>
          <BrandLockup compact />
            <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.55, margin: "0 0 24px" }}>
              Enter your Hedera testnet account ID to begin. This identifies
              you to Vela — it does not grant access to your funds. Vela
              always pays vendors from its own operator wallet.
            </p>

            <label
              style={{
                display: "block",
                fontSize: 11,
                fontFamily: "var(--font-mono)",
                color: "var(--text-dim)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 6,
              }}
            >
              Account ID
            </label>
            <input
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="0.0.xxxxxxx"
              autoFocus
              style={{
                width: "100%",
                background: "var(--surface-raised)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "10px 12px",
                color: "var(--text)",
                fontFamily: "var(--font-mono)",
                fontSize: 14,
                outline: "none",
                marginBottom: 16,
              }}
            />

            {error && (
              <div
                style={{
                  fontSize: 12.5,
                  color: "var(--danger)",
                  fontFamily: "var(--font-mono)",
                  marginBottom: 16,
                  lineHeight: 1.5,
                }}
              >
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setStage("welcome")}
                disabled={loading}
                style={{
                  background: "transparent",
                  color: "var(--text-muted)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "11px 16px",
                  fontSize: 14,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                Back
              </button>
              <button
                onClick={handleConnect}
                disabled={loading || !accountId.trim()}
                style={{
                  flex: 1,
                  background: "var(--accent)",
                  color: "#06150d",
                  border: "none",
                  borderRadius: 8,
                  padding: "11px 18px",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: loading || !accountId.trim() ? "not-allowed" : "pointer",
                  opacity: loading || !accountId.trim() ? 0.5 : 1,
                }}
              >
                {loading ? "Verifying…" : "Connect"}
              </button>
            </div>
        </div>
      </div>
    </main>
  );
}

function BrandLockup({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`${styles.brand} ${compact ? styles.brandCompact : ""}`}>
      <Image src="/favicon.ico" alt="" width={18} height={18} className={styles.brandIcon} />
      <span>VELA</span>
    </div>
  );
}

function FlowStep({ code, title, detail }: { code: string; title: string; detail: string }) {
  return (
    <div className={styles.routeLine}>
      <div className={styles.node}>{code}</div>
      <div className={styles.routeBody}>
        <div className={styles.routeTitle}>{title}</div>
        <div className={styles.routeDetail}>{detail}</div>
      </div>
    </div>
  );
}
