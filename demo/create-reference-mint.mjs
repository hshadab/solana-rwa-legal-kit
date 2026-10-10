/**
 * Creates the reference mint for the Solana RWA Legal Kit on devnet.
 *
 * The mint is a worked example of the transfer restriction schedule: each
 * extension it enables corresponds to a numbered restriction in
 * docs/transfer-restriction-schedule.md.
 *
 *   DefaultAccountState = Frozen   US-1, US-9   eligibility enforced at thaw
 *   PermanentDelegate              US-13        issuer forced transfer / redemption
 *   TransferHook                   US-6, US-10  per-transfer time-based rules
 *   FreezeAuthority                US-12        sanctions screening, order of a court
 *   MetadataPointer + Metadata     disclosure standard resolution by mint
 *
 * The TransferHook extension is initialized with its authority set and no hook
 * program assigned. That is deliberate: the extension must exist at mint
 * creation (it cannot be added later), while the hook program implementing the
 * Rule 144 and Regulation S clocks is M1 work. An unset hook means transfers
 * are not blocked by a hook today.
 *
 * Usage:  node create-reference-mint.mjs
 * Env:    RPC_URL (default devnet), PAYER_SECRET_KEY (JSON array; generated if absent)
 */

import {
  Connection, Keypair, SystemProgram, Transaction,
  sendAndConfirmTransaction, LAMPORTS_PER_SOL, clusterApiUrl,
} from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID, ExtensionType, getMintLen, AccountState,
  createInitializeMintInstruction,
  createInitializeDefaultAccountStateInstruction,
  createInitializePermanentDelegateInstruction,
  createInitializeTransferHookInstruction,
  createInitializeMetadataPointerInstruction,
  TYPE_SIZE, LENGTH_SIZE,
} from '@solana/spl-token';
import { createInitializeInstruction, pack } from '@solana/spl-token-metadata';
import fs from 'node:fs';

const RPC = process.env.RPC_URL || clusterApiUrl('devnet');
const DECIMALS = 6;

function loadOrCreatePayer() {
  if (process.env.PAYER_SECRET_KEY) {
    return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(process.env.PAYER_SECRET_KEY)));
  }
  if (fs.existsSync('payer.json')) {
    return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync('payer.json', 'utf8'))));
  }
  const kp = Keypair.generate();
  fs.writeFileSync('payer.json', JSON.stringify(Array.from(kp.secretKey)));
  console.log('Generated new payer keypair -> payer.json (gitignored)');
  return kp;
}

async function fund(connection, payer) {
  let balance = await connection.getBalance(payer.publicKey);
  if (balance >= 0.05 * LAMPORTS_PER_SOL) return balance;
  console.log('Requesting devnet airdrop...');
  for (const sol of [1, 0.5, 0.25]) {
    try {
      const sig = await connection.requestAirdrop(payer.publicKey, sol * LAMPORTS_PER_SOL);
      await connection.confirmTransaction(sig, 'confirmed');
      balance = await connection.getBalance(payer.publicKey);
      if (balance > 0) return balance;
    } catch (e) {
      console.log(`  airdrop of ${sol} SOL failed: ${e.message.split('\n')[0]}`);
    }
  }
  return connection.getBalance(payer.publicKey);
}

const main = async () => {
  const connection = new Connection(RPC, 'confirmed');
  const payer = loadOrCreatePayer();
  console.log('RPC:  ', RPC);
  console.log('Payer:', payer.publicKey.toBase58());

  const balance = await fund(connection, payer);
  console.log('Balance:', (balance / LAMPORTS_PER_SOL).toFixed(4), 'SOL');
  if (balance < 0.02 * LAMPORTS_PER_SOL) {
    console.error('\nInsufficient balance. Fund the payer above and re-run.');
    console.error('Faucet: https://faucet.solana.com (paste the payer address)');
    process.exit(1);
  }

  const mintKp = Keypair.generate();
  const mint = mintKp.publicKey;
  const authority = payer.publicKey;

  const metadata = {
    mint,
    name: 'RWA Legal Kit Reference',
    symbol: 'RWALK',
    uri: 'https://raw.githubusercontent.com/hshadab/solana-rwa-legal-kit/main/examples/example-disclosure.json',
    additionalMetadata: [
      ['disclosure_standard', 'rwa-disclosure-v0.1'],
      ['restrictions', 'US-1,US-6,US-9,US-10,US-12,US-13'],
      ['purpose', 'reference example; not a security; no value'],
    ],
  };

  const extensions = [
    ExtensionType.MetadataPointer,
    ExtensionType.DefaultAccountState,
    ExtensionType.PermanentDelegate,
    ExtensionType.TransferHook,
  ];
  const mintLen = getMintLen(extensions);
  const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(metadata).length;
  const lamports = await connection.getMinimumBalanceForRentExemption(mintLen + metadataLen);

  const tx = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey, newAccountPubkey: mint,
      space: mintLen, lamports, programId: TOKEN_2022_PROGRAM_ID,
    }),
    // Extensions must be initialized before the mint itself.
    createInitializeMetadataPointerInstruction(mint, authority, mint, TOKEN_2022_PROGRAM_ID),
    createInitializeDefaultAccountStateInstruction(mint, AccountState.Frozen, TOKEN_2022_PROGRAM_ID),
    createInitializePermanentDelegateInstruction(mint, authority, TOKEN_2022_PROGRAM_ID),
    createInitializeTransferHookInstruction(mint, authority, null, TOKEN_2022_PROGRAM_ID),
    createInitializeMintInstruction(mint, DECIMALS, authority, authority, TOKEN_2022_PROGRAM_ID),
    // Metadata is written after the mint is initialized.
    createInitializeInstruction({
      programId: TOKEN_2022_PROGRAM_ID, mint, metadata: mint,
      name: metadata.name, symbol: metadata.symbol, uri: metadata.uri,
      mintAuthority: authority, updateAuthority: authority,
    }),
  );

  console.log('\nCreating mint...');
  const sig = await sendAndConfirmTransaction(connection, tx, [payer, mintKp], {
    commitment: 'confirmed',
  });

  const out = {
    network: RPC.includes('devnet') ? 'devnet' : RPC,
    mint: mint.toBase58(),
    tokenProgram: TOKEN_2022_PROGRAM_ID.toBase58(),
    decimals: DECIMALS,
    mintAuthority: authority.toBase58(),
    freezeAuthority: authority.toBase58(),
    permanentDelegate: authority.toBase58(),
    defaultAccountState: 'frozen',
    transferHookProgram: null,
    signature: sig,
    explorer: `https://explorer.solana.com/address/${mint.toBase58()}?cluster=devnet`,
    createdAt: new Date().toISOString(),
  };

  fs.writeFileSync('reference-mint.json', JSON.stringify(out, null, 2) + '\n');
  console.log('\nMint created.');
  console.log(JSON.stringify(out, null, 2));
};

main().catch((e) => { console.error(e); process.exit(1); });
