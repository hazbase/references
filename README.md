# hazbase-references

Runnable reference implementations for **hazBase**.

This repository demonstrates **how hazBase is actually deployed and wired in practice**.
While `hazbase/contracts` focuses on Solidity source code,
this repository focuses on **execution-level workflows** using `@hazbase/kit` + `ethers`.

This repository is intentionally **UI-free** and focuses on:

- recommended deployment order
- required wiring (roles, addresses, dependencies)
- governance and timelock execution flows
- emergency pause and recovery propagation

Each folder corresponds **1:1 with a documentation page** and is designed to be
directly runnable on a testnet.

> 📘 Documentation: https://docs.hazbase.com/reference/compliant-market

---

## Prerequisites

- Node.js 18+
- An RPC endpoint (e.g. Sepolia)
- A funded private key on the target network (testnet recommended)

---

## Install

```bash
npm install
```

---

## Configure env

Copy `.env.example` to `.env` and fill in required values.

```bash
cp .env.example .env
```

> ⚠️ Never commit real private keys.  
> `.env` is intentionally gitignored.

---

## Run an example

Examples are executed using `tsx` (TypeScript runtime).

```bash
npm run ex:compliant:deploy
npm run ex:compliant:wire
npm run ex:compliant:flows
```

Each step is designed to be executed independently and inspected on-chain.

---

## Structure

```text
hazbase-references/
  compliant-market/
    README.md              # scenario-specific explanation
    scripts/
      00-deploy.ts         # contract deployment
      01-wire.ts           # role & dependency wiring
      02-flows.ts          # pause / governance flow examples
  package.json
  tsconfig.json
  .env.example
```

---

## Notes

- This repository is a **reference**, not a production template.
- It may evolve faster than `hazbase/contracts`.
- Treat scripts as **executable documentation**.
- Secrets must never be committed to git.
