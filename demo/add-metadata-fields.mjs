/**
 * Writes the additionalMetadata fields onto the reference mint.
 *
 * createInitializeInstruction only writes name, symbol and uri. Additional
 * fields each need their own updateField instruction, and each one grows the
 * account, so rent has to be topped up first.
 *
 * Usage: node add-metadata-fields.mjs
 */

import {
  Connection, Keypair, Transaction, SystemProgram,
  sendAndConfirmTransaction, clusterApiUrl, PublicKey,
} from '@solana/web3.js';
import { TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { createUpdateFieldInstruction } from '@solana/spl-token-metadata';
import fs from 'node:fs';

const RPC = process.env.RPC_URL || clusterApiUrl('devnet');

const FIELDS = [
  ['disclosure_standard', 'rwa-disclosure-v0.1'],
  ['restrictions', 'US-1,US-6,US-9,US-10,US-12,US-13'],
  ['purpose', 'reference example; not a security; no value'],
  ['repo', 'github.com/hshadab/solana-rwa-legal-kit'],
];

const main = async () => {
  const connection = new Connection(RPC, 'confirmed');
  const payer = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync('payer.json', 'utf8'))),
  );
  const { mint: mintStr } = JSON.parse(fs.readFileSync('reference-mint.json', 'utf8'));
  const mint = new PublicKey(mintStr);

  // Each field adds roughly key + value + 8 bytes of length prefixes.
  const extraBytes = FIELDS.reduce((n, [k, v]) => n + k.length + v.length + 8, 0);
  const topUp = await connection.getMinimumBalanceForRentExemption(extraBytes);

  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: payer.publicKey, toPubkey: mint, lamports: topUp,
    }),
    ...FIELDS.map(([field, value]) =>
      createUpdateFieldInstruction({
        programId: TOKEN_2022_PROGRAM_ID,
        metadata: mint,
        updateAuthority: payer.publicKey,
        field,
        value,
      }),
    ),
  );

  const sig = await sendAndConfirmTransaction(connection, tx, [payer], {
    commitment: 'confirmed',
  });
  console.log('Metadata fields written.');
  console.log('signature:', sig);

  const ref = JSON.parse(fs.readFileSync('reference-mint.json', 'utf8'));
  ref.additionalMetadata = Object.fromEntries(FIELDS);
  ref.metadataSignature = sig;
  fs.writeFileSync('reference-mint.json', JSON.stringify(ref, null, 2) + '\n');
};

main().catch((e) => { console.error(e); process.exit(1); });
