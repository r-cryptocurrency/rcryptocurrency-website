import { cookies } from 'next/headers';

const ADMIN_COOKIE_NAME = 'admin_session';
const SESSION_MAX_AGE = 60 * 60 * 24; // 24 hours in seconds

// Simple token generation (in production, use a proper JWT library)
function generateToken(timestamp: number): string {
  const secret = process.env.ADMIN_PASSWORD || '';
  // Create a simple hash-like token
  const data = `admin:${timestamp}:${secret}`;
  return Buffer.from(data).toString('base64');
}

function verifyToken(token: string): boolean {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [prefix, timestampStr, secret] = decoded.split(':');

    if (prefix !== 'admin') return false;
    if (secret !== (process.env.ADMIN_PASSWORD || '')) return false;

    const timestamp = parseInt(timestampStr, 10);
    const now = Date.now();
    const age = (now - timestamp) / 1000;

    // Check if token is expired
    if (age > SESSION_MAX_AGE) return false;

    return true;
  } catch {
    return false;
  }
}

export async function createAdminSession(): Promise<void> {
  const token = generateToken(Date.now());
  const cookieStore = await cookies();

  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
}

export async function verifyAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (!token) return false;
  return verifyToken(token);
}

export async function destroyAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}

export function validatePassword(password: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    console.error('ADMIN_PASSWORD environment variable not set');
    return false;
  }
  return password === adminPassword;
}
