/**
 * AES-256-GCM encryption helpers for short secrets (e.g., OAuth tokens).
 * Stored format: base64url( 12-byte IV || ciphertext+tag )
 *
 * Uses Node's WebCrypto API (Node >= 18).
 */

import { webcrypto, randomBytes } from "node:crypto";
import { env } from "../config/env";

const subtle = webcrypto.subtle;

// 32-byte key (AES-256) from hex
const keyBytes = Buffer.from(env.ENCRYPTION_KEY_HEX, "hex");

async function importKey() {
  return subtle.importKey("raw", keyBytes, "AES-GCM", false, ["encrypt", "decrypt"]);
}

/** Encrypt Buffer or string → base64url payload */
export async function encrypt(plaintext: Buffer | string): Promise<string> {
  const iv = randomBytes(12); // 96-bit nonce recommended for GCM
  const key = await importKey();
  const data = typeof plaintext === "string" ? Buffer.from(plaintext, "utf8") : plaintext;
  const enc = await subtle.encrypt({ name: "AES-GCM", iv }, key, data);
  // Concatenate IV + ciphertext+tag and emit base64url
  return Buffer.concat([iv, Buffer.from(enc)]).toString("base64url");
}

/** Decrypt base64url payload → utf8 string */
export async function decrypt(ciphertextB64: string): Promise<string> {
  const payload = Buffer.from(ciphertextB64, "base64url");
  const iv = payload.subarray(0, 12);
  const data = payload.subarray(12);
  const key = await importKey();
  const dec = await subtle.decrypt({ name: "AES-GCM", iv }, key, data);
  return Buffer.from(dec).toString("utf8");
}
