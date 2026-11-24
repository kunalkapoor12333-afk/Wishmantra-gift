import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

const TOKEN_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours
const PROCESS_FALLBACK_TOKEN_SECRET = crypto.randomBytes(32).toString('hex');

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILED_LOGINS = 10;
const failedLoginBuckets = new Map<string, { count: number; resetAt: number }>();

export function getConfiguredAdminPasscode(): string | null {
  const configured = process.env.ADMIN_PASSCODE?.trim();
  return configured && configured.length > 0 ? configured : null;
}

function getTokenSecret(): string {
  return process.env.ADMIN_TOKEN_SECRET?.trim() || PROCESS_FALLBACK_TOKEN_SECRET;
}

export function constantTimeEqualText(a: string, b: string): boolean {
  const digestA = crypto.createHash('sha256').update(a, 'utf8').digest();
  const digestB = crypto.createHash('sha256').update(b, 'utf8').digest();
  return crypto.timingSafeEqual(digestA, digestB);
}

export function hashPasscode(passcode: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(passcode, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPasscodeHash(passcode: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, expectedHex] = parts;
  if (!salt || !expectedHex) return false;
  try {
    const derived = crypto.scryptSync(passcode, salt, 64);
    const expected = Buffer.from(expectedHex, 'hex');
    if (derived.length !== expected.length) return false;
    return crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

export function checkAdminLoginRateLimit(ip: string): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const entry = failedLoginBuckets.get(ip);
  if (!entry || now >= entry.resetAt) {
    failedLoginBuckets.delete(ip);
    return { allowed: true, retryAfterSec: 0 };
  }
  if (entry.count >= MAX_FAILED_LOGINS) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }
  return { allowed: true, retryAfterSec: 0 };
}

export function recordFailedAdminLogin(ip: string): void {
  const now = Date.now();
  const entry = failedLoginBuckets.get(ip);
  if (!entry || now >= entry.resetAt) {
    failedLoginBuckets.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
  } else {
    entry.count += 1;
  }
}

export function clearFailedAdminLogins(ip: string): void {
  failedLoginBuckets.delete(ip);
}

export function createAdminToken(): string {
  const payload = JSON.stringify({
    role: 'admin',
    exp: Date.now() + TOKEN_TTL_MS,
  });
  const encoded = Buffer.from(payload, 'utf8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', getTokenSecret())
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${sig}`;
}

export function verifyAdminToken(token: string | undefined | null): boolean {
  if (!token || !token.includes('.')) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [encoded, sig] = parts;
  if (!encoded || !sig) return false;

  const expectedSig = crypto
    .createHmac('sha256', getTokenSecret())
    .update(encoded)
    .digest('base64url');

  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length) return false;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return false;

  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as {
      role?: string;
      exp?: number;
    };
    return parsed.role === 'admin' && typeof parsed.exp === 'number' && parsed.exp > Date.now();
  } catch {
    return false;
  }
}

export function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.slice('Bearer '.length).trim();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const token = extractBearerToken(req);
  if (!verifyAdminToken(token)) {
    res.status(401).json({ error: 'Unauthorized. Please sign in to the Admin Panel.' });
    return;
  }
  next();
}
