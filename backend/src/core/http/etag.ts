import crypto from "node:crypto";
export function strongETagFromDate(d: Date | string) {
  const buf = Buffer.from(typeof d === "string" ? d : d.toISOString());
  return `"${crypto.createHash("sha256").update(buf).digest("base64url")}"`;
}
