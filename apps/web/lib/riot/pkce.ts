import { createHash, randomBytes } from "node:crypto";

/** RFC 7636: 43–128 karakter URL-safe verifier */
export function generateCodeVerifier(): string {
  return randomBytes(32).toString("base64url");
}

export function codeChallengeS256(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}
