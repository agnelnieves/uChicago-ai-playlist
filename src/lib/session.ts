import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Cookie configuration
const SESSION_COOKIE_NAME = 'hyde_session';
const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year in seconds

/**
 * Hash an IP address using SHA-256 for privacy
 * The hash is salted with a server-side secret to prevent rainbow table attacks
 */
export function hashIP(ip: string): string {
  const salt = process.env.SESSION_SECRET || 'hyde-playlist-default-salt';
  return createHash('sha256')
    .update(`${salt}:${ip}`)
    .digest('hex');
}

/**
 * Generate a cryptographically secure session token
 */
export function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Extract the client IP address from a Next.js request
 * Handles various proxy headers and falls back to direct connection
 */
export function getClientIP(request: NextRequest): string {
  // Check for forwarded headers (common in production behind proxies/load balancers)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, the first one is the client
    const ips = forwardedFor.split(',').map((ip) => ip.trim());
    if (ips[0]) return ips[0];
  }

  // Vercel-specific header
  const vercelForwardedFor = request.headers.get('x-vercel-forwarded-for');
  if (vercelForwardedFor) {
    return vercelForwardedFor.split(',')[0].trim();
  }

  // Real IP header (used by some proxies like nginx)
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Cloudflare header
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback to localhost for development
  return '127.0.0.1';
}

/**
 * Get the session token from cookies (server-side)
 */
export async function getSessionTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  return sessionCookie?.value || null;
}

/**
 * Get the session token from a request (useful in API routes)
 */
export function getSessionTokenFromRequest(request: NextRequest): string | null {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
  return sessionCookie?.value || null;
}

/**
 * Set the session cookie on a response
 */
export function setSessionCookie(response: NextResponse, sessionToken: string): NextResponse {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: sessionToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_COOKIE_MAX_AGE,
    path: '/',
  });
  return response;
}

/**
 * Create a response with session cookie set
 */
export function createResponseWithSession<T>(
  data: T,
  sessionToken: string,
  status: number = 200
): NextResponse {
  const response = NextResponse.json(data, { status });
  return setSessionCookie(response, sessionToken);
}

/**
 * Get user agent from request
 */
export function getUserAgent(request: NextRequest): string | null {
  return request.headers.get('user-agent');
}

