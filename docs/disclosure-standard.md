# RWA Disclosure Standard, v0.1

**Draft. Effective date: October 9, 2026.**

A standardized, machine-readable disclosure format for issuers of permissioned real-world assets and tokenized securities on Solana. Each disclosure is keyed to a token mint, so a wallet, explorer, venue, or investor can resolve a mint address to a consistent description of what the token represents, who is responsible for it, and what controls the issuer holds over it.

## The problem this solves

An investor looking at a tokenized asset on Solana today can read the mint's supply and extensions on-chain. What they cannot do is answer the questions that actually matter: who is the issuer, what law governs the instrument, who custodies the underlying asset, how redemption works, who holds the freeze authority and the permanent delegate, and where the audited financials are.

That information exists, scattered across offering memoranda, websites, and PDFs, in a different shape for every issuer. Nothing connects it to the mint address. Venues and wallets that want to surface it have nothing consistent to read, so most surface nothing.

This standard defines the minimum consistent disclosure, in a form a human can read and a program can parse.

## Design principles

1. **Keyed to the mint.** The token mint address is the primary key. One mint, one disclosure.
2. **The issuer is the author.** Disclosures are published and signed by the issuer. No third party, including any registry operator, asserts that the contents are accurate.
3. **Completeness is checkable; accuracy is not.** A registry or validator can confirm that required fields are present and well-formed. It cannot confirm that the custodian named is really the custodian. The standard says so plainly, and so should anything built on it.
4. **Control disclosure is mandatory.** The powers an issuer holds over holder tokens, meaning freeze authority, thaw authority, and permanent delegate, are the most consequential and least disclosed facts about a permissioned token. They are required fields.
5. **No personal data.** The format carries information about the issuer and the instrument, never about holders.
6. **Versioned and dated.** Every disclosure carries a schema version, a publication timestamp, and a validity period. Stale disclosures are visibly stale rather than silently wrong.

## Where a disclosure lives

A disclosure is a JSON document. It can be published in three ways, in descending order of preference:

| Method | How it resolves | Notes |
| --- | --- | --- |
| On-chain metadata pointer | The token's metadata URI points to the disclosure document | Strongest binding, since the pointer is controlled by the mint authority |
| Well-known URI | `https://<issuer-domain>/.well-known/rwa-disclosure/<mint>.json` | Convenient; relies on domain control |
| Registry submission | Published to a public registry that indexes by mint | Fallback for issuers who cannot control the metadata URI |

Whichever method is used, the document should be reachable without authentication and served with `Content-Type: application/json`.

## Required fields

Every disclosure must contain these. A document missing any of them is incomplete.

### Identification

| Field | Type | Description |
| --- | --- | --- |
| `schemaVersion` | string | The version of this standard, for example `"0.1"` |
| `mint` | string | Solana mint address, base58 |
| `tokenStandard` | string | `"mpl-3643"`, `"token-2022"`, or `"spl-token"` |
| `assetName` | string | Name of the instrument as used in the offering documents |
| `publishedAt` | string | ISO 8601 timestamp |
| `validUntil` | string | ISO 8601 timestamp after which the disclosure should be treated as stale |

### Issuer

| Field | Type | Description |
| --- | --- | --- |
| `issuer.legalName` | string | Full legal name of the issuing entity |
| `issuer.jurisdiction` | string | Jurisdiction of organization, ISO 3166 plus subdivision where relevant |
| `issuer.entityType` | string | For example `"Delaware LLC"`, `"Cayman exempted company"` |
| `issuer.registrationNumber` | string | Company or registration number, where one exists publicly |
| `issuer.contact` | string | A working contact address for investors |

### Instrument

| Field | Type | Description |
| --- | --- | --- |
| `instrument.type` | string | For example `"fund units"`, `"debt note"`, `"treasury-backed token"`, `"equity"` |
| `instrument.underlyingAsset` | string | What the token represents |
| `instrument.governingLaw` | string | Governing law of the instrument |
| `instrument.offeringExemption` | array | Exemptions relied upon, for example `["Reg D 506(c)", "Reg S"]` |
| `instrument.isSecurity` | boolean | Whether the issuer treats the instrument as a security |

### Controls

The required core of the standard. Every power over holder tokens must be disclosed.

| Field | Type | Description |
| --- | --- | --- |
| `controls.freezeAuthority` | object | `{ "address": string, "heldBy": string, "conditions": string }` |
| `controls.permanentDelegate` | object | Same shape; `null` if the extension is not enabled |
| `controls.canForceTransfer` | boolean | Whether the issuer can move holder tokens without holder signature |
| `controls.canPause` | boolean | Whether transfers can be globally halted |
| `controls.transferRestrictions` | array | References to the restriction identifiers in the transfer restriction schedule, for example `["US-1", "US-6", "US-12"]` |
| `controls.upgradeable` | boolean | Whether any program governing the token can be upgraded, and by whom |

`heldBy` names the human or entity controlling the key, not just the address. An address alone tells a reader nothing about who can act.

### Custody and redemption

| Field | Type | Description |
| --- | --- | --- |
| `custody.custodian` | string | Who holds the underlying asset; `"n/a"` where there is none |
| `custody.arrangement` | string | Brief description of the custody arrangement |
| `redemption.available` | boolean | Whether holders can redeem |
| `redemption.terms` | string | Conditions, windows, and minimums |
| `redemption.settlementAsset` | string | What redemption pays in, including mint address if on-chain |

### Documents

| Field | Type | Description |
| --- | --- | --- |
| `documents.offeringDocuments` | string | URI, may be access-gated |
| `documents.auditReports` | array | URIs to financial audits or attestations, with dates |
| `documents.smartContractAudits` | array | URIs to security audits of any custom program |

## Recommended fields

Not required, but materially useful: `fees` (management, redemption, transfer), `valuation` (methodology and frequency), `riskFactors` (URI), `transferAgent`, `secondaryVenues`, and `priorIncidents`.

## Validation

A conforming validator checks:

1. All required fields are present and correctly typed.
2. `mint` is a valid base58 address of the right length.
3. `publishedAt` is in the past and `validUntil` is in the future.
4. Declared on-chain controls match what the mint actually shows. If `controls.permanentDelegate` is `null` but the mint has the permanent delegate extension enabled, the disclosure fails validation.
5. Every identifier in `controls.transferRestrictions` exists in the transfer restriction schedule.

Point 4 is the one that gives the standard teeth. It is the only check that compares a claim against the chain, and it catches the most consequential kind of misstatement.

**What validation does not do.** It does not verify that the named custodian holds the asset, that the audit reports are genuine, or that the offering documents say what the disclosure says they say. Any interface displaying a validated disclosure must say so.

## Files

- [`schema/rwa-disclosure-v0.1.json`](../schema/rwa-disclosure-v0.1.json): JSON Schema for the format
- [`examples/example-disclosure.json`](../examples/example-disclosure.json): a complete worked example for a fictional issuer

## Open questions for v0.2

1. **Signing.** Disclosures should be signed by the mint authority so a reader can verify authorship without trusting the hosting domain. The signature envelope is not yet specified.
2. **Multi-chain keys.** The same instrument may exist on several chains. A shared instrument identifier, with per-chain mint entries, would avoid duplicate disclosures diverging.
3. **Update semantics.** Whether a disclosure is replaced in place or appended as a new version, and how a reader finds the history.
4. **Enumerations.** `instrument.type` and `offeringExemption` should probably become controlled vocabularies rather than free text.
5. **Minimum viable subset.** Twenty-plus required fields may be too many for a small issuer. A tiered conformance level is worth considering.

## Contributing

Feedback from issuers on whether these fields are publishable, and from wallets and venues on whether they are consumable, is the most useful input at this stage. Open an issue.

**This is not legal advice.** Publishing a conforming disclosure does not satisfy any disclosure obligation under securities law, and this standard is not a substitute for an offering document prepared by counsel.
