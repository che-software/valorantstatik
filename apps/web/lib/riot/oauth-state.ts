import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

function sign(encodedPayload: string, secret: string): string {
  return createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

/** CSRF state + PKCE verifier taşımak için kısa ömürlü imzalı paket */
export function sealOAuthState(payloadJson: string, secret: string): string {
  const encoded = Buffer.from(payloadJson, "utf8").toString("base64url");
  const sig = sign(encoded, secret);
  return `${encoded}.${sig}`;
}

export function unsealOAuthState(token: string, secret: string): string | null {
  const lastDot = token.lastIndexOf(".");
  if (lastDot <= 0) return null;
  const encoded = token.slice(0, lastDot);
  const sig = token.slice(lastDot + 1);
  const expected = sign(encoded, secret);
  try {
    if (!timingSafeEqual(Buffer.from(sig, "utf8"), Buffer.from(expected, "utf8"))) return null;
  } catch {
    return null;
  }
  return Buffer.from(encoded, "base64url").toString("utf8");
}

export function randomState(): string {
  return randomBytes(16).toString("hex");
}
