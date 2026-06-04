import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

const ALG = "aes-256-gcm";
const IV_LEN = 12;
const TAG_LEN = 16;
const SCRYPT_SALT = "riot-oauth-sess-v1";

let derivedKey: Buffer | null = null;

function getKey(password: string): Buffer {
  if (derivedKey) return derivedKey;
  derivedKey = scryptSync(password, SCRYPT_SALT, 32);
  return derivedKey;
}

export function encryptSessionJson(obj: unknown, password: string): string {
  const key = getKey(password);
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALG, key, iv);
  const plain = JSON.stringify(obj);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64url");
}

export function decryptSessionJson<T>(b64: string, password: string): T | null {
  try {
    const key = getKey(password);
    const buf = Buffer.from(b64, "base64url");
    if (buf.length < IV_LEN + TAG_LEN + 1) return null;
    const iv = buf.subarray(0, IV_LEN);
    const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
    const data = buf.subarray(IV_LEN + TAG_LEN);
    const decipher = createDecipheriv(ALG, key, iv);
    decipher.setAuthTag(tag);
    const out = Buffer.concat([decipher.update(data), decipher.final()]);
    return JSON.parse(out.toString("utf8")) as T;
  } catch {
    return null;
  }
}
