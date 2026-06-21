# Vela

An AI agent that autonomously purchases real data — weather, crypto prices — by paying HBAR on Hedera, with a deterministic policy layer that gates every payment before it happens.

Built for the Hedera AI Agent Kit bounty (Week 5: Hedera Policy Agent).

---

## What it does

A user asks Vela for information. Vela decides which vendor sells that data, attempts to pay them in HBAR, and — only if the payment passes every policy check — executes the transfer on Hedera and fetches the real data from a live public API.

```
User: "what's the weather in Nairobi?"
        ↓
Vela picks the WeatherAPI vendor (1 HBAR)
        ↓
Policy gate:
  AllowlistPolicy   → is this vendor approved?
  SpendLimitPolicy  → is 1 HBAR under the per-transaction cap?
  DailyBudgetPolicy → is there budget left today?
        ↓
   any failure → blocked, no money moves, reason shown
   all pass    → HBAR sent on Hedera, real weather fetched, both shown
```

Every attempt — successful or blocked — is shown in the UI with the full policy trail, not just a pass/fail summary.

---

## Why this matters for the bounty

The brief asks for a policy layer using Hedera Agent Kit Hooks & Policies that constrains agent behavior while still enabling real payments, with the policy layer "clearly integrated into the interface and execution flow." Vela's design maps directly onto that:

| Bounty requirement | How Vela satisfies it |
|---|---|
| Spend limits | `SpendLimitPolicy` — hard cap per transaction |
| Allowed counterparties | `AllowlistPolicy` — vendor accounts must be pre-approved |
| Contextual approval logic | `DailyBudgetPolicy` — running daily total, enforced at runtime |
| Agents purchase real services/APIs | Real HBAR payments unlock real calls to Open-Meteo and CoinGecko |
| Policy layer in the interface | Every chat response surfaces its full policy trail in the transaction log panel |
| Policy layer in execution flow | Policies run **before** any transaction is formed — a block means zero on-chain activity, not a rollback |

---

## Architecture

```
Browser
  ├─ Connect screen        → verifies a Hedera account exists (read-only, no fund access)
  ├─ Chat panel             → talks to the AI agent
  └─ Transaction log panel  → shows every purchase attempt + policy trail

Next.js API routes
  ├─ /api/chat               → user message → Gemini (with buy_data tool) → reply
  ├─ /api/agent/buy           → manual/direct policy-gated purchase (same engine as the tool)
  ├─ /api/hedera/status        → operator wallet connection + balance check
  ├─ /api/hedera/transfer       → raw HBAR transfer, no policies (testing only)
  └─ /api/hedera/verify-account → confirms a user-supplied account ID exists on-chain

Core logic (lib/)
  ├─ agent/
  │   ├─ model.ts      → Gemini 2.5 Flash, configured once
  │   ├─ tools.ts       → the one tool the AI can call: buy_data(vendorId, query)
  │   ├─ chat.ts         → orchestrates one turn: message → tool call → reply
  │   └─ purchase.ts      → runs the policy gate, then executes the transfer
  ├─ policies/
  │   ├─ types.ts             → shared Policy interface + runPolicies() runner
  │   ├─ allowlist-policy.ts   → blocks unapproved vendor accounts
  │   ├─ spend-limit-policy.ts  → blocks per-transaction amounts over the cap
  │   └─ daily-budget-policy.ts  → blocks once the daily total is exceeded (Redis-backed)
  ├─ hedera/
  │   ├─ config.ts   → validates env vars with clear errors
  │   ├─ client.ts    → singleton Hedera client (testnet/mainnet)
  │   └─ transfer.ts   → the raw sendHbar() primitive, policy-unaware by design
  ├─ vendors.ts   → hardcoded vendor catalog + real API calls (Open-Meteo, CoinGecko)
  └─ redis.ts      → Upstash client, used only for the daily spend counter
```

### Design principles this was built around

**One AI tool, not many.** The agent only ever calls `buy_data(vendorId, query)`. A small decision space makes behavior easy to reason about and reliable to demo.

**Three policies, no more.** Allowlist, spend limit, daily budget — enough to demonstrate the Hooks & Policies lifecycle without inventing requirements mid-build.

**Policies are pure functions; only the daily budget needs state.** Allowlist and spend-limit checks need nothing but the request itself. Daily budget is the one place persistence is unavoidable (a running total across requests), so it's the only thing touching Redis — a single key, with automatic UTC-midnight expiry.

**Payment and policy are separate from data-fetching.** `lib/hedera/transfer.ts` knows nothing about policies. `lib/policies/` knows nothing about vendors. `lib/agent/purchase.ts` composes policy + transfer. The AI tool layer composes purchase + real data fetch. Each layer is independently testable.

**Vendors are config, not a platform.** `lib/vendors.ts` is a hardcoded array — no database, no admin UI, no CRUD. Adding a vendor means editing one file and redeploying.

**A blocked purchase is a successful policy outcome, not a server error.** `/api/agent/buy` and `/api/chat` return HTTP 200 with `executed: false` when a policy blocks a payment — the system working as intended, not something going wrong.

---

## What's explicitly out of scope

Kept deliberately out to avoid scope creep on a deadline:

- Multiple users / accounts with separate budgets
- Adding vendors via a UI (editing `vendors.ts` is the supported path)
- USDC support (HBAR only for this submission)
- Mainnet by default (testnet for development; mainnet only for the final demo if desired)
- Real wallet custody — the "connect" screen identifies who's asking, it does not grant Vela access to anyone's funds. Vela always pays vendors from its own operator wallet.
- A fourth policy, or any policy beyond the three implemented

---

## Tech stack

- **Next.js 15/16** (App Router, API routes) — chosen so the whole app (frontend + backend) lives in one deployable repo
- **Hedera Agent Kit + Hedera SDK** — wallet operations, transfers, balance queries
- **LangChain + Google Gemini 2.5 Flash** — tool-calling AI layer (free tier, no cost to run)
- **Upstash Redis** — the single daily-spend counter, HTTP-based so it works in serverless functions
- **Open-Meteo & CoinGecko** — free, keyless public APIs the agent actually pays to access

---

## Setup

### 1. Install

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in:

```bash
# Hedera
HEDERA_NETWORK=testnet
HEDERA_ACCOUNT_ID=0.0.xxxxxxx
HEDERA_PRIVATE_KEY=...
HEDERA_KEY_TYPE=ecdsa            # or ed25519

# Upstash Redis (console.upstash.com — free tier)
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...

# Policy limits
POLICY_MAX_HBAR_PER_TRANSFER=5
POLICY_DAILY_BUDGET_HBAR=20
POLICY_ALLOWED_VENDOR_ACCOUNTS=0.0.xxxxxxx,0.0.yyyyyyy   # must match lib/vendors.ts

# AI model (aistudio.google.com/apikey — free, no card required)
GOOGLE_API_KEY=...
```

`POLICY_ALLOWED_VENDOR_ACCOUNTS` and the `hederaAccountId` values in `lib/vendors.ts` must match exactly, or every purchase attempt will be correctly blocked by `AllowlistPolicy`.

### 3. Run

```bash
npm run dev
```

Visit `http://localhost:3000`, connect with any real Hedera testnet account ID, and ask Vela for weather or crypto prices.

---

## Verifying it for yourself

- **Connection check:** `GET /api/hedera/status` — confirms the operator wallet and returns its live balance
- **Raw transfer (no policy):** `POST /api/hedera/transfer` — sanity-checks the transfer mechanism alone
- **Policy-gated purchase:** `POST /api/agent/buy` with `{ "toAccountId": "...", "amountHbar": 1 }` — same engine the AI uses
- **Full agent loop:** `POST /api/chat` with `{ "message": "what's the weather in Nairobi" }`

Every successful transfer returns a real Hedera transaction ID, verifiable at [hashscan.io/testnet](https://hashscan.io/testnet).

To see a block happen on purpose, ask for something while the daily budget is near its limit, or temporarily lower `POLICY_MAX_HBAR_PER_TRANSFER` below a vendor's price.

---

## Project status

- [x] Hedera connection (testnet)
- [x] HBAR transfer primitive
- [x] Three policies: allowlist, spend limit, daily budget
- [x] Policy-gated purchase route
- [x] AI agent (Gemini 2.5 Flash) with tool-calling
- [x] Real data fetching (Open-Meteo, CoinGecko) after successful payment
- [x] Connect screen (account verification, no fund access)
- [x] Split-screen chat + transaction log UI
- [ ] Deployment (Vercel)
- [ ] Mainnet demo recording
- [ ] AI Studio tools feedback submission

---

## License

Built for the Hedera AI Agent Kit bounty. See repository for license details.
