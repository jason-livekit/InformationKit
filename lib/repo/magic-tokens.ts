import { getKV } from './redis';
import { makeSlug } from './ids';

export const MAGIC_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes

const tokenKey = (token: string) => `magicToken:${token}`;

interface StoredToken {
  email: string;
  expiresAt: number;
}

export interface IssueOptions {
  ttlMs?: number;
}

export interface IssuedToken {
  token: string;
  expiresAt: number;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Generate a single-use magic-link token tied to an email. Returns the opaque token string
 * and its expiry timestamp. Tokens are stored in the KV under `magicToken:{token}` with the
 * email + expiresAt. They are deleted on first consumption.
 */
export async function issueMagicToken(
  email: string,
  options: IssueOptions = {},
): Promise<IssuedToken> {
  const kv = getKV();
  const ttl = options.ttlMs ?? MAGIC_TOKEN_TTL_MS;
  // 32 chars of slug entropy → plenty for a short-lived link.
  const token = makeSlug(8).replace(/-/g, '');
  const expiresAt = Date.now() + ttl;
  const record: StoredToken = { email: normalizeEmail(email), expiresAt };
  await kv.jsonSet(tokenKey(token), record);
  return { token, expiresAt };
}

/**
 * Look up a token and return the email it was issued for. Single-use — the record is deleted
 * before this returns, whether the token was valid, expired, or missing. Returns null if the
 * token is unknown or expired.
 */
export async function consumeMagicToken(token: string): Promise<string | null> {
  const kv = getKV();
  const key = tokenKey(token);
  const record = await kv.jsonGet<StoredToken>(key);
  if (!record) return null;
  // Always clear so a leaked token can be reused at most once.
  await kv.del(key);
  if (record.expiresAt < Date.now()) return null;
  return record.email;
}
