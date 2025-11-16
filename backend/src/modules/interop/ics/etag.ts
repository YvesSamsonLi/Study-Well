import crypto from "crypto";

/**
 * Strong opaque ETag based on payload hash.
 * If the ICS content does not change, the ETag remains the same → enables 304.
 */

export function strongETag(payload: string) {
  const hash = crypto.createHash("sha1").update(payload).digest("hex");
  return `"WILL-NOT-CHANGE-${hash}"`; // quotes required by HTTP spec
}
