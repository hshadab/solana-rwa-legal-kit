# Solana RWA Legal Kit

Open-source offering documents, a legal-to-on-chain transfer restriction mapping, and a disclosure standard for issuers of permissioned real-world assets and tokenized securities on Solana.

**Status: early draft, in active development.** The mapping below is published early and openly so that issuers, counsel, and tokenization platforms can correct it while the underlying standards are still young.

## Why this exists

Metaplex launched MPL-3643 on September 29, 2026, giving Solana a shared on-chain compliance layer for permissioned assets: an Identity Registry, Compliance Module, Gate, and Lifecycle Manager built over Token-2022, Token ACL (sRFC 37), and the Solana Attestation Service.

The on-chain layer now exists. The legal layer does not.

An issuer configuring an MPL-3643 Identity Registry still has no public template stating what the Regulation D or Regulation S restriction behind that setting should say, no risk factor set written for Solana's freeze-and-thaw eligibility model, and no standard way to disclose any of it to investors or venues. Every issuer rebuilds that work with its own counsel, which produces inconsistent documents, no shared conventions, and a mismatch risk between what the offering documents promise and what the token actually enforces.

This repository publishes that missing layer as a public good.

## What is here, and what is planned

| Component | Status |
| --- | --- |
| [Transfer restriction schedule](docs/transfer-restriction-schedule.md) | Draft, pending verification against MPL-3643 program documentation |
| [Disclosure standard](docs/disclosure-standard.md) | Draft v0.1, with [JSON Schema](schema/rwa-disclosure-v0.1.json) and a [worked example](examples/example-disclosure.json) |
| [Reference mint on devnet](demo/README.md) | Live: [`9Ku4Fd54...GeX3e`](https://explorer.solana.com/address/9Ku4Fd54Tr8U8Mzw3a3iLMQ6YqjMrNkHTU943c4GeX3e?cluster=devnet) |
| Model token terms and conditions | Planned |
| Subscription agreement and investor questionnaire | Planned |
| Risk factors, including Solana and MPL-3643 specific risks | Planned |
| Custody and redemption terms | Planned |
| Plain-English US and EU regulatory guide | Planned |
| Document assembly site | Planned |
| Public disclosure registry | Planned |

## The core idea

There are two central artifacts.

The **disclosure standard** defines what an issuer must publish about a tokenized asset, keyed to the token mint, so that a wallet, venue, or investor can resolve a mint address to a consistent account of who the issuer is, what the instrument is, and what powers the issuer holds over holder tokens. Its required `controls` block is the part that matters most: freeze authority, permanent delegate, and force-transfer capability are the most consequential and least disclosed facts about a permissioned token, and a validator can check those claims against what the mint actually shows on-chain.

The **transfer restriction schedule** is the other: a table where each row states a legal restriction, the authority it comes from, the words that express it in the offering documents, and the on-chain mechanism that enforces it. A lawyer and an engineer can read the same row and confirm the token does what the documents promise.

Solana's enforcement model makes this mapping chain-specific rather than cosmetic. Unlike ERC-3643 on EVM chains, which checks compliance inside every transfer, MPL-3643 enforces eligibility at freeze and thaw: token accounts are created frozen, and only a wallet that passes the compliance checks can have one thawed. Rules that genuinely require per-transfer evaluation, such as lockups and volume limits, use a Token-2022 transfer hook instead. A Regulation S distribution compliance period and a Rule 144 holding period therefore map to different mechanisms than they would on Ethereum, and the documents have to say which.

## Scope

**In scope:** United States (Regulation D 506(b) and 506(c), Regulation S, Rule 144, transfer agent and recordkeeping considerations) and the European Union (MiCA, the DLT Pilot Regime, prospectus requirements). Stablecoin settlement legs are addressed under the GENIUS Act.

**Out of scope:** every other jurisdiction, tax advice, and any representation that using these materials results in compliance.

## This is not legal advice

These are starting drafts for review and adaptation by the issuer's own counsel. Using them creates no attorney-client relationship with the author or any contributor, and nothing here is a legal opinion on any specific offering, token, or jurisdiction. Securities regulation is fact-specific, and a document that is appropriate for one offering can be wrong for another. Every section carries an effective date because the law changes.

## Contributing

Corrections are the most valuable contribution, particularly from:

- Issuers and counsel who have taken a permissioned asset to mainnet on Solana
- Engineers who have configured MPL-3643 or Token-2022 transfer hooks in production
- EU counsel on the MiCA and DLT Pilot sections

Open an issue or a pull request. Please do not include confidential or client-identifying information.

## Licenses

This repository uses two licenses, because it contains two kinds of material.

- **Documents, templates, schedules, and guides**, including everything in `docs/`: Creative Commons Attribution 4.0 International (CC BY 4.0). See [LICENSE-DOCS](LICENSE-DOCS).
- **Code**, including any scripts, tooling, and the document assembly site: MIT. See [LICENSE](LICENSE).

Use either kind freely, including commercially, with attribution.

## Author

Houman Shadab. New York-admitted securities and financial regulation lawyer. Former Professor of Law at New York Law School, where he founded the Innovation Center for Law and Technology. Stanford CodeX Fellow. Author of the chapter on United States regulation of blockchain token sales in *Regulating Blockchain* (Oxford University Press, 2019). Co-founder of Clause, acquired by DocuSign.
