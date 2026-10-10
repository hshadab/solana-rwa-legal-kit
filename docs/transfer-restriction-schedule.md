# Transfer Restriction Schedule

**Draft. Effective date: October 10, 2026.**

This schedule maps legal transfer restrictions to the on-chain mechanisms that enforce them for permissioned assets on Solana. It is the bridge between an offering's legal documents and its token configuration: each row states a restriction, the authority behind it, the operative language for the documents, and the enforcement mechanism.

**The rows map to Solana's own primitives, not to any one framework.** Every permissioned token framework on Solana composes the same three building blocks: `DefaultAccountState = Frozen` with a freeze and thaw decision, a Token-2022 transfer hook, and a permanent delegate. What the frameworks differ on is who holds the decision and how it is configured. Mapping the primitives keeps the schedule useful whichever framework an issuer picks, and the section below says where the choice of framework changes the legal analysis.

Mechanism assignments follow the [MPL-3643 documentation](https://www.metaplex.com/docs/smart-contracts/mpl-3643) and its [getting started guide](https://www.metaplex.com/docs/smart-contracts/mpl-3643/getting-started), read October 10, 2026, and for the other frameworks the [RedStone Tokenization and RWA Standards Report 2026](https://www.redstone.finance/blog/tokenization-rwa-report-2026). The legal analysis is the author's.

> **Status of the underlying standard.** MPL-3643 is live on Solana mainnet in early access. It is **not audited**, Metaplex lists it as Experimental on its Stability Index, and its documentation states: "Do not custody real assets without coordinating with Metaplex." The compliance module set "may change before release." Any issuer adopting it now must disclose that.

## How enforcement works

MPL-3643 splits enforcement into two layers, and the distinction decides which legal restriction can go where.

**Boundary enforcement** controls who may hold the token at all. Token accounts are created frozen (`DefaultAccountState = Frozen`, which cannot be added to a mint after creation). The mint's freeze authority is delegated to a Token ACL (sRFC 37) `MintConfig` PDA, which is the only component that calls Token-2022 freeze and thaw. Token ACL asks the Gate Program, which checks identity claims in the Identity Registry and hold eligibility in the Compliance Module. Thaw is **permissionless**: anyone may call `thaw_permissionless`, and the Gate Program decides. A boundary-only token has no transfer hook, so transfers after thaw carry no MPL-3643 compute cost.

**Per-transfer enforcement** controls each individual transfer and runs through a Token-2022 transfer hook. It is opt-in, and the hook extension must exist at mint creation. Integrators follow a three-step envelope: **prepare** (ensure the destination ATA exists, thaw it, resolve hook accounts), **transfer** (`transfer_checked` with hook metas appended), **finalize** (checkpoint yield for both parties, if the token pays yield).

Every restriction below is assigned to one of five mechanisms:

| Mechanism | What it is | Fits |
| --- | --- | --- |
| **Boundary (freeze/thaw)** | Eligibility checked at thaw by the Gate Program against Identity Registry claims | Status facts about the holder: KYC, accreditation, residency, sanctions screening |
| **Per-transfer (hook)** | A compliance module evaluated on each transfer | Restrictions depending on time, amount, or cumulative state |
| **Issuer intervention** | The Lifecycle Manager moves tokens through guardrailed recovery instructions | Redemptions, erroneous issuance, orders of a court or regulator |
| **Re-freeze** | `freeze_permissionless`, called by a cranker on a holder who falls out of compliance | Lapsed or revoked eligibility, new sanctions hits |
| **Off-chain only** | Legally required, not mechanically enforced | Facts the chain cannot observe |

The last category matters most. A restriction that is off-chain only must still appear in the offering documents, and the documents must not imply the token enforces it.

## Enforcement frameworks on Solana

An issuer has a choice here, and it changes the legal analysis in two places. MPL-3643 is the newest and the only one with public module documentation, but it is not the one institutions use today.

| Framework | Identity model | Thaw decision | Per-transfer | SEC transfer agent | Used by |
| --- | --- | --- | --- | --- | --- |
| **MPL-3643** | Wallet-keyed claims in an Identity Registry, with topic, attestor and expiry | Gate Program, permissionless to request | Compliance modules via transfer hook, opt-in | No | No public issuer yet. Launched September 29, 2026, unaudited, early access |
| **Securitize DS Protocol** | Investor-centric: many wallets map to one investor ID; per-investor on-chain vault from 2026 | Off-chain compliance screening, with on-chain revocation | Transfer hook plus permanent delegate enforcing DS logic natively | **Yes** | BlackRock BUIDL, VanEck VBILL, Apollo ACRED |
| **Superstate** | Entity IDs grouping wallets per investor | Permissionless thaw on Solana | Transfer hook | **Yes** | Opening Bell platform; Galaxy Digital, Exodus, Forward Industries |
| **Centrifuge** | Per share class | Four configurable transfer hook modes, from freely transferable to fully restricted | Transfer hook | **Yes** | Centrifuge pools |
| **Token-2022 direct** | Frozen by default, thawed on KYC; supports Civic Pass and the Solana Attestation Service | The issuer's own freeze authority | Issuer-written hook program, or none | No | Circle USYC (allow-listing), PayPal PYUSD (hook plus permanent delegate) |

### Where the framework choice changes the legal analysis

**Transfer agent status.** Securitize, Superstate and Centrifuge hold SEC transfer agent registration. MPL-3643 does not, and neither does Token-2022 itself. For an issuance where a registered transfer agent is required or desirable, that is not a configuration detail: it decides who maintains the official holder record, who processes distributions and voting, and who sets record dates. See US-14.

**Who the holder is.** Securitize maps many wallets to one investor ID, Superstate uses Entity IDs, and MPL-3643's Investor cap module counts linked wallets as one. All three solve the same problem, which is that US holder-counting rules attach to persons and chain enforcement attaches to accounts. A framework without that linkage leaves the issuer counting accounts, which is the wrong unit. See US-3 and US-15.

**Everything else is substantially the same**, because it has to be. All of these frameworks run on `DefaultAccountState = Frozen`, a transfer hook, and a permanent delegate. A Rule 144 holding period is a hook rule in every one of them, and a forced transfer is a permanent delegate operation in every one of them. That is why the rows below are organized by primitive.

**One Solana-wide constraint, whichever framework.** A transfer hook and confidential transfers cannot both be active on the same token. Any offering needing per-transfer rules therefore has public transfer amounts, which is a disclosure item rather than a choice.

## Named compliance modules (MPL-3643)

MPL-3643 ships these modules, which issuers enable and configure independently. The mapping to legal restrictions is the useful part of this document.

| Module | Rule it enforces | Restrictions below |
| --- | --- | --- |
| Country | Allow and deny lists against the residency claim's country | US-9, EU-2 |
| Holder cap | Caps total holders | US-15 |
| Investor cap | Caps unique investors; linked wallets count as one | US-3 |
| Lockup | Time-locks newly acquired tokens before transfer | US-6, US-10 |
| Affiliate volume | Caps transfer volume for designated holders | US-7 |
| Blackout | Halts transfers during scheduled windows | US-16 |
| Jurisdiction pair | Restricts transfers between country pairs | US-9, EU-2 |
| Venue | Restricts trading to approved venues | US-17 |

Parameter names and types are not published. Those cells remain open below, and alpha access to the SDKs is what closes them.

## United States

### Regulation D, Rule 506(b) and 506(c)

| # | Restriction | Authority | Operative document language (summary) | Mechanism | Configuration |
| --- | --- | --- | --- | --- | --- |
| US-1 | Holder must be an accredited investor | Rule 501(a); Rule 506(c) requires reasonable steps to verify | Tokens may be held only by persons the issuer has determined to be accredited investors | Boundary | Identity Registry `Claim` on the accreditation topic, issued by a trusted attestor authorized for that topic and listed in the token's trust scope |
| US-2 | Verification of accredited status (506(c) only) | Rule 506(c)(2)(ii) | Issuer or its agent must take reasonable steps to verify accredited status before the holder may receive tokens | Boundary, with off-chain evidence | The claim records the attestor and expiry. The verification itself happens off-chain; the attestor is the accountable party and must be named in the documents |
| US-3 | Limit on non-accredited purchasers (506(b) only) | Rule 506(b)(2)(i), up to 35 non-accredited purchasers | The issuer will not permit holdings by more than 35 non-accredited persons | Per-transfer | The rule counts persons, so the framework must link a person's wallets. MPL-3643: Investor cap module, where linked wallets count as one investor, and which **must be enabled before any supply exists**. Securitize: one investor ID across many wallets. Superstate: Entity IDs. Bare Token-2022: no linkage, so the issuer counts accounts, which is the wrong unit and needs an off-chain control |
| US-4 | No general solicitation (506(b) only) | Rule 502(c) | Issuer covenant on how the offering is conducted | Off-chain only | Not enforceable on-chain. Must not be described as token-enforced |
| US-5 | Restricted securities legend | Rule 144(a)(3); Securities Act Section 5 | Tokens are restricted securities and may not be resold absent registration or an exemption | Boundary plus metadata | Legend recorded in token metadata; resale gated by US-6 |

### Rule 144 and resale

| # | Restriction | Authority | Operative document language (summary) | Mechanism | Configuration |
| --- | --- | --- | --- | --- | --- |
| US-6 | Holding period before resale (6 months for reporting issuers, 12 months otherwise) | Rule 144(d) | No resale before the applicable holding period has run from the later of acquisition or payment in full | Per-transfer | Lockup module, which time-locks newly acquired tokens. Requires the transfer hook, so the hook extension must exist at mint creation. *Parameter names TBD* |
| US-7 | Volume limits for affiliates | Rule 144(e) | Affiliate resales limited to the greater of 1% of outstanding or average weekly trading volume | Per-transfer, partially | Affiliate volume module caps volume for designated holders. The 1% prong is computable on-chain; the trading-volume prong is not, and the documents must say the on-chain control implements only part of the rule |
| US-8 | Affiliate status | Rule 144(a)(1) | Affiliates are subject to additional resale conditions | Boundary flag | An internal classification claim topic marking affiliate status. Must be updatable, since status changes |

### Regulation S

| # | Restriction | Authority | Operative document language (summary) | Mechanism | Configuration |
| --- | --- | --- | --- | --- | --- |
| US-9 | Offshore transaction; no US person | Rule 902(k), Rule 903 | Tokens may be held only by persons who are not US persons and are outside the United States | Boundary | Country module against the residency claim, which records an ISO-3166 country code. Jurisdiction pair module where transfers between specific countries must also be restricted |
| US-10 | Distribution compliance period (40 days or 1 year depending on category) | Rule 903(b)(2), 903(b)(3) | No resale to a US person during the distribution compliance period other than under a registration or exemption | Per-transfer | Lockup module. This is a time-based rule, so it belongs in the hook, not in boundary eligibility. *Parameter names TBD* |
| US-11 | Category 3 certification and legending | Rule 903(b)(3)(iii) | Purchaser certifications and legends required for equity of domestic issuers | Boundary plus metadata | Claim topic plus legend |

### Other US

| # | Restriction | Authority | Operative document language (summary) | Mechanism | Configuration |
| --- | --- | --- | --- | --- | --- |
| US-12 | Sanctions screening | OFAC; 31 CFR Chapter V | No holding or transfer by a sanctioned person; the issuer or any party may cause an ineligible account to be frozen | Boundary plus re-freeze | A sanctions screening claim topic with an expiry. When a claim lapses or is revoked, a cranker calls `freeze_permissionless`. The documents must state the claim refresh interval and who operates the cranker |
| US-13 | Forced transfer and redemption | Charter, LPA, or token terms | The issuer may compel transfer or redeem on stated conditions | Issuer intervention | Recovery-enabled mints set the Token-2022 permanent delegate to a Lifecycle Manager address **with no private key**. It signs only through guardrailed instructions with separate proposer and approver roles, a timelock, a bounded execution window, an audit trail, and per-request target and amount. A mint with no permanent delegate cannot be clawed back at all, which is itself a disclosure item |
| US-14 | Transfer agent recordkeeping | Exchange Act Section 17A, where applicable | The issuer maintains the official holder record | Off-chain, with on-chain reference | **The framework choice decides this one.** Securitize, Superstate and Centrifuge hold SEC transfer agent registration and run distributions, voting and record dates through it. MPL-3643 and bare Token-2022 do not, so the issuer must appoint a transfer agent separately or establish that none is required. Either way, state whether the chain is the official record or a mirror, because the answer governs a chain reorganization or a contested transfer. Only canonical Associated Token Accounts are tracked by holder accounting |
| US-15 | Holder cap (Exchange Act registration threshold) | Exchange Act Section 12(g) | The issuer may refuse transfers that would exceed the stated holder threshold | Per-transfer | Same person-versus-account problem as US-3, and the same framework-dependent answer. MPL-3643: Holder cap module, which **must be enabled before any supply exists and cannot be disabled once activated**, an irreversibility the documents should disclose. Securitize's investor-centric identity is reported to address the roughly 2,000-holder threshold directly |
| US-16 | Trading blackout windows | Issuer insider trading policy; contractual lockups | Transfers are suspended during stated windows | Per-transfer | Blackout module, scheduled windows |
| US-17 | Approved venue restriction | Token terms; venue agreements | Tokens may be traded only on approved venues | Per-transfer | Venue module. Note the limits of this: it restricts on-chain transfers to approved venue accounts and cannot reach off-chain arrangements |

## European Union

| # | Restriction | Authority | Operative document language (summary) | Mechanism | Configuration |
| --- | --- | --- | --- | --- | --- |
| EU-1 | Qualified investor limitation | Prospectus Regulation (EU) 2017/1129 Art. 1(4) | The offer is limited to qualified investors, or falls below the relevant thresholds | Boundary | Claim topic for qualified investor status |
| EU-2 | Jurisdiction restrictions | National private placement regimes | Tokens may not be offered or transferred into listed jurisdictions | Boundary | Country module deny list; Jurisdiction pair module for pairwise restrictions |
| EU-3 | MiCA scope determination | Regulation (EU) 2023/1114 | Whether the token is a financial instrument under MiFID II, and therefore outside MiCA, or a crypto-asset within it | Off-chain, determinative | A threshold legal question, not a transfer restriction. It governs which rules apply to everything else |
| EU-4 | DLT Pilot Regime limits | Regulation (EU) 2022/858 | Issuance size and venue limits where the regime is used | Off-chain plus per-transfer | Supply limits partially enforce issuance caps; the Venue module addresses venue limits |
| EU-5 | GDPR constraints on on-chain data | Regulation (EU) 2016/679 | No personal data on-chain; claims reference off-chain records | Design constraint | Claims are wallet-keyed and record a topic, attestor and expiry, not personal data. A wallet-keyed claim that can be linked to a natural person may still be personal data, and on-chain records are not practically erasable |

## Stablecoin settlement leg

| # | Restriction | Authority | Operative document language (summary) | Mechanism | Configuration |
| --- | --- | --- | --- | --- | --- |
| SL-1 | Permitted payment stablecoin | GENIUS Act | Subscriptions and redemptions settle only in a named permitted payment stablecoin | Off-chain plus payment flow | Specify accepted mint addresses in the subscription documents |
| SL-2 | Settlement finality | Token terms | When payment is deemed received | Off-chain | Define in terms of confirmation depth, and state what happens on a failed or reversed transfer |

## Configuration order and irreversible steps

MPL-3643 enforces an order of operations, and three steps cannot be undone. Counsel should know these before an issuer begins, because each one forecloses a choice the documents may need.

1. The mint must be created as Token-2022 with `DefaultAccountState = Frozen`. **This cannot be added later.** The transfer hook extension likewise must exist at creation if any per-transfer module may ever be needed.
2. Token ACL config is created and sealed, with permissionless thaw and permissionless freeze enabled.
3. The gate config is initialized, which requires the raw mint authority and creates the trust scope.
4. Accepted KYC providers are added to the trust scope.
5. Lifecycle yield and recovery configs are initialized, if used. **Requires the raw mint authority.**
6. The compliance config is initialized. **This irreversibly transfers the mint's `MintTokens` authority to the `ComplianceConfig` PDA.** Anything needing the raw mint authority must happen before this step.
7. Gate extra account meta lists are initialized, binding the gate to the live compliance config.
8. Modules are enabled and configured, then initial supply is minted through the Compliance Module's mint flow.

Roles are `owner`, `operator` and `agent`, granted through per-program `RoleGrant` PDAs. The issuer needs a registry token-issuer role grant to create its own compliance, gate and yield configs without a Metaplex co-signature.

## Open issues

1. **Who operates the cranker.** Re-freeze is permissionless, which means it depends on someone actually calling it. An issuer relying on re-freeze for sanctions compliance should say who runs the cranker and how often, because "permissionless" is not the same as "automatic."
2. **Claim expiry policy.** Claims carry an expiry, which solves the staleness problem mechanically, but the issuer still chooses the interval. Too long and the control is weak; too short and holders are frozen out by administrative lag. The documents should state the interval and the consequence of a lapse.
3. **The 1% prong of Rule 144(e).** The Affiliate volume module can cap volume, but average weekly trading volume is off-chain data. Either an oracle supplies it or the documents disclose that only part of the rule is enforced on-chain.
4. **Non-canonical token accounts.** Holder accounting tracks only canonical Associated Token Accounts. The practical effect of a holder using a non-canonical account on holder-cap and investor-cap compliance needs testing.
5. **Unaudited and experimental.** MPL-3643 is live on mainnet, not audited, and marked Experimental, with module composition subject to change. That is a disclosable risk and a reason to coordinate with Metaplex before any real issuance.
6. **Parameter names and types.** Module configuration fields, numeric claim topic identifiers, and program IDs are not published. Alpha access to the SDKs (`@metaplex-foundation/mpl-permission` for TypeScript, `mpl-permission` for Rust) is what fills them in.

## Resolved since the first draft

Two problems flagged in the first version of this schedule turn out to be solved by the protocol design.

- **Attestation freshness.** Claims carry an expiry, and `freeze_permissionless` lets a cranker re-freeze a holder who falls out of compliance. The first draft said no mechanism re-verified eligibility after thaw; one exists.
- **Per-account versus per-holder counting.** The Investor cap module counts linked wallets as one investor, which matches the legal unit. The first draft treated the mismatch between per-account enforcement and per-holder rules as unresolved.

## Contributing

Corrections from issuers, counsel, and engineers who have configured these programs are the most valuable contribution to this file. Open an issue or a pull request.

**This is not legal advice.** These are starting drafts for review by the issuer's own counsel. No attorney-client relationship is created by their use.
