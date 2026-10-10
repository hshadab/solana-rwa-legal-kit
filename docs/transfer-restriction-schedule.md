# Transfer Restriction Schedule

**Draft. Effective date: October 9, 2026.**

This schedule maps legal transfer restrictions to the on-chain mechanisms that enforce them for permissioned assets on Solana. It is the bridge between an offering's legal documents and its token configuration: each row states a restriction, the authority behind it, the operative language for the documents, and the enforcement mechanism.

## How to read this

Every restriction is assigned to one of four enforcement mechanisms:

| Mechanism | What it is | When to use it |
| --- | --- | --- |
| **Eligibility (freeze/thaw)** | Token accounts are created frozen. An account is thawed only for a wallet that passes compliance checks, with eligibility evidenced by attestation. | Status-based restrictions that are true or false about the holder: accreditation, jurisdiction, sanctions screening, qualified purchaser status. |
| **Per-transfer check (transfer hook)** | A Token-2022 transfer hook program evaluates each transfer at execution. | Restrictions that depend on time, amount, or cumulative state: lockups, holding periods, volume limits, holder caps. |
| **Issuer intervention (permanent delegate)** | The issuer moves or reclaims tokens without holder signature. | Forced transfers, redemptions, court orders, erroneous issuance, death or dissolution of a holder. |
| **Off-chain only** | The restriction is legal but not mechanically enforced on-chain. | Restrictions that depend on facts the chain cannot observe, such as the purpose of a purchase or a representation about investment intent. |

The fourth category matters most. A restriction that is off-chain only must still appear in the offering documents, and the documents must not imply that the token enforces it.

A live reference mint on devnet demonstrates four of these mechanisms: `9Ku4Fd54Tr8U8Mzw3a3iLMQ6YqjMrNkHTU943c4GeX3e` ([explorer](https://explorer.solana.com/address/9Ku4Fd54Tr8U8Mzw3a3iLMQ6YqjMrNkHTU943c4GeX3e?cluster=devnet), [how it is built](../demo/README.md)). Its on-chain metadata names the restrictions it implements, so the schedule can be checked against a real account.

> **Verification needed.** The mechanism assignments below reflect MPL-3643's published architecture: four programs (Identity Registry, Compliance Module, Gate, Lifecycle Manager) built over Token-2022, Token ACL (sRFC 37), and the Solana Attestation Service, with eligibility enforced at freeze and thaw and per-transfer rules handled by transfer hooks. Specific program parameters, attestation schemas, and configuration field names are **not yet filled in** and must be verified against the Metaplex documentation and the alpha release. MPL-3643 is in limited-access alpha and has not completed a full security audit. Do not rely on this schedule for a live offering until those cells are completed and reviewed.

## United States

### Regulation D, Rule 506(b) and 506(c)

| # | Restriction | Authority | Operative document language (summary) | Mechanism | Configuration |
| --- | --- | --- | --- | --- | --- |
| US-1 | Holder must be an accredited investor | Rule 501(a); Rule 506(c) requires reasonable steps to verify | Transfers permitted only to persons the issuer has determined to be accredited investors | Eligibility | Identity Registry attestation of accreditation; account thawed on verification. *Schema TBD* |
| US-2 | Verification of accredited status (506(c) only) | Rule 506(c)(2)(ii) | Issuer or its agent must take reasonable steps to verify accredited status before transfer | Eligibility, with off-chain evidence | Attestation issued by verification provider; the verification itself is off-chain. *Provider and schema TBD* |
| US-3 | Limit on non-accredited purchasers (506(b) only) | Rule 506(b)(2)(i), up to 35 non-accredited purchasers | Transfers to non-accredited persons are prohibited after the offering closes | Eligibility plus per-transfer count | Attestation class plus holder-count rule. *TBD* |
| US-4 | No general solicitation (506(b) only) | Rule 502(c) | Issuer covenant; not a transfer restriction | Off-chain only | Not enforceable on-chain. Must not be described as token-enforced. |
| US-5 | Restricted securities legend | Rule 144(a)(3); Securities Act Section 5 | Tokens are restricted securities and may not be resold absent registration or an exemption | Eligibility plus per-transfer check | Legend recorded in token metadata; resale gated by US-6. *Metadata field TBD* |

### Rule 144 and resale

| # | Restriction | Authority | Operative document language (summary) | Mechanism | Configuration |
| --- | --- | --- | --- | --- | --- |
| US-6 | Holding period before resale (6 months for reporting issuers, 12 months otherwise) | Rule 144(d) | No resale before the applicable holding period has run from the later of acquisition or payment in full | Per-transfer check | Transfer hook evaluating per-account acquisition timestamp. **Note:** the hook must track acquisition time per token account, not per wallet, or transfers between a holder's own accounts can reset or evade the clock. *Implementation TBD* |
| US-7 | Volume limits for affiliates | Rule 144(e) | Affiliate resales limited to the greater of 1% of outstanding or average weekly volume | Per-transfer check plus off-chain data | Hook can enforce the 1% prong on-chain; the trading-volume prong requires an oracle or off-chain attestation. Document the limitation. |
| US-8 | Affiliate status | Rule 144(a)(1) | Affiliates are subject to additional resale conditions | Eligibility flag | Attestation marking affiliate status; must be updatable as status changes. *TBD* |

### Regulation S

| # | Restriction | Authority | Operative document language (summary) | Mechanism | Configuration |
| --- | --- | --- | --- | --- | --- |
| US-9 | Offshore transaction; no US person | Rule 902(k), Rule 903 | Tokens may be held only by persons who are not US persons and are outside the United States | Eligibility | Jurisdiction and US-person attestation; account thawed only for eligible wallets. *Schema TBD* |
| US-10 | Distribution compliance period (40 days or 1 year depending on category) | Rule 903(b)(2), 903(b)(3) | No resale to a US person during the distribution compliance period other than under a registration or exemption | Per-transfer check | Transfer hook enforcing a time window measured from the later of the offering close or the last sale. **Note:** this is a time-based rule, so it belongs in the hook, not in freeze/thaw eligibility. *Implementation TBD* |
| US-11 | Category 3 certification and legending | Rule 903(b)(3)(iii) | Purchaser certifications and legends required for equity of domestic issuers | Eligibility plus metadata | Attestation plus legend. *TBD* |

### Other US

| # | Restriction | Authority | Operative document language (summary) | Mechanism | Configuration |
| --- | --- | --- | --- | --- | --- |
| US-12 | Sanctions screening | OFAC; 31 CFR Chapter V | No transfer to a sanctioned person or jurisdiction; issuer may freeze or reclaim | Eligibility plus issuer intervention | Screening attestation refreshed on an interval; freeze on hit; permanent delegate for reclaim where legally required. **Note:** state the refresh interval in the documents, since a stale attestation is the main weakness here. |
| US-13 | Forced transfer and redemption | Charter, LPA, or token terms | Issuer may compel transfer or redeem on stated conditions | Issuer intervention | Permanent delegate. **Note:** the permanent delegate is a standing power to move any holder's tokens. The documents must disclose it explicitly as a risk, state who controls it, and state the conditions for its use. |
| US-14 | Transfer agent recordkeeping | Exchange Act Section 17A, where applicable | Issuer maintains the official holder record | Off-chain, with on-chain reference | Determine whether the chain is the official record or a mirror. The documents must say which, because the answer governs what happens on a chain reorganization or a contested transfer. |
| US-15 | Holder cap (Exchange Act registration threshold) | Exchange Act Section 12(g) | Issuer may refuse transfers that would exceed the holder threshold | Per-transfer check | Hook enforcing a holder count. *TBD* |

## European Union

| # | Restriction | Authority | Operative document language (summary) | Mechanism | Configuration |
| --- | --- | --- | --- | --- | --- |
| EU-1 | Qualified investor limitation | Prospectus Regulation (EU) 2017/1129 Art. 1(4) | Offer limited to qualified investors, or below the relevant thresholds | Eligibility | Attestation of qualified investor status. *TBD* |
| EU-2 | Jurisdiction restrictions | National private placement regimes | Tokens may not be offered or transferred into listed jurisdictions | Eligibility | Jurisdiction attestation. *TBD* |
| EU-3 | MiCA scope determination | Regulation (EU) 2023/1114 | Whether the token is a financial instrument under MiFID II, and therefore outside MiCA, or a crypto-asset within it | Off-chain, determinative | This is a threshold legal question, not a transfer restriction. It governs which rules apply to everything else. |
| EU-4 | DLT Pilot Regime limits | Regulation (EU) 2022/858 | Issuance size and venue limits where the regime is used | Off-chain plus per-transfer check | Issuance caps can be partly enforced by supply limits. *TBD* |
| EU-5 | GDPR constraints on on-chain data | Regulation (EU) 2016/679 | No personal data on-chain; attestations reference off-chain records | Design constraint | Attestations must be pseudonymous pointers, not personal data. An on-chain identifier that can be linked to a natural person may itself be personal data, and on-chain records are not practically erasable. |

## Stablecoin settlement leg

| # | Restriction | Authority | Operative document language (summary) | Mechanism | Configuration |
| --- | --- | --- | --- | --- | --- |
| SL-1 | Permitted payment stablecoin | GENIUS Act | Subscriptions and redemptions settle only in a named permitted payment stablecoin | Off-chain plus payment flow | Specify the accepted mint addresses in the subscription documents. |
| SL-2 | Settlement finality | Token terms | When payment is deemed received | Off-chain | Define in terms of confirmation depth, and state what happens on a failed or reversed transfer. |

## Open issues

1. **Attestation freshness.** Accreditation lapses, sanctions lists change, and residency changes. Neither freeze/thaw nor a transfer hook re-verifies an attestation on its own. The documents must state the refresh interval and the consequence of a stale attestation, and the configuration must implement it.
2. **Per-account versus per-holder clocks.** Rule 144 and Regulation S time limits attach to the holder's acquisition, but Solana enforcement attaches to token accounts. A holder with several accounts can create ambiguity. Resolve this before any live offering.
3. **Transfer hook and confidential transfers are mutually exclusive.** A token using a transfer hook cannot also use confidential transfers. Any offering needing per-transfer rules therefore has public transfer amounts, which is a disclosure item.
4. **Who holds the keys.** Freeze authority, thaw authority, and permanent delegate are powers over investor property. The documents must identify the holder of each, the governance around their use, and what happens on key loss or compromise.
5. **Alpha status.** MPL-3643 is in limited-access alpha and has not completed a full security audit. This is a disclosable risk for any issuer adopting it now.

## Contributing

Corrections from issuers, counsel, and engineers who have configured these programs in production are the most valuable contribution to this file. Open an issue or a pull request.

**This is not legal advice.** These are starting drafts for review by the issuer's own counsel. No attorney-client relationship is created by their use.
