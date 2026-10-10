# Reference mint

A Token-2022 mint on devnet that demonstrates the enforcement mechanisms in the [transfer restriction schedule](../docs/transfer-restriction-schedule.md). Each extension corresponds to a numbered restriction, so the schedule can be checked against a live account rather than read in the abstract.

| Extension | Restrictions | What it demonstrates |
| --- | --- | --- |
| `DefaultAccountState = Frozen` | US-1, US-9 | Token accounts are created frozen. Eligibility, such as accredited or non-US-person status, is enforced at thaw rather than on each transfer. |
| `PermanentDelegate` | US-13 | The issuer can move holder tokens without the holder's signature, for redemptions, erroneous issuance, or an order of a court or regulator. |
| `TransferHook` | US-6, US-10 | Reserved for per-transfer time-based rules: the Rule 144 holding period and the Regulation S distribution compliance period. |
| Freeze authority | US-12 | Freezing an existing account on a sanctions screening hit or a lapsed attestation. |
| `MetadataPointer` + metadata | Disclosure standard | The mint resolves to its disclosure document, the strongest of the three publication methods in the [standard](../docs/disclosure-standard.md). |

## Two honest notes about this mint

**The transfer hook has no program assigned.** The extension is initialized with its authority set and the hook program left unset. A Token-2022 extension cannot be added after the mint is created, so the slot has to exist from the start, while the hook program that implements the Rule 144 and Regulation S clocks is M1 work. Transfers are therefore not gated by a hook today.

**This is a reference example, not a security.** It represents nothing, has no value, carries no offering, and exists on devnet only. The metadata says so.

## Running it

```bash
npm install
node create-reference-mint.mjs
```

The script uses `payer.json` if present, otherwise generates one and attempts a devnet airdrop. Airdrops are frequently rate-limited; if one fails, fund the printed payer address at https://faucet.solana.com and re-run. `PAYER_SECRET_KEY` (a JSON array) and `RPC_URL` override both defaults.

Output is written to `reference-mint.json` with the mint address, the authorities, and the transaction signature.

**Key custody.** The payer keypair is the mint authority, the freeze authority and the permanent delegate for the mint it creates. `payer.json` is gitignored. Generate it on a machine you control rather than reusing a key from elsewhere, and treat it as disposable: this is a devnet demonstration, not an issuance.
