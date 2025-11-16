import crypto from "node:crypto";

/** Generate a cryptographically strong opaque token (base64url). */
export function generateToken(len = 32) {
  return crypto.randomBytes(len).toString("base64url");
}

/** Hash a token with SHA-256 for storage. */
export function hashToken(raw: string) {
  return crypto.createHash("sha256").update(raw).digest("base64");
}
