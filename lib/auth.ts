import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const MONITOR_COOKIE = 'falcon_hod_monitor_session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

function sha(value: string) {
  return createHmac('sha256', 'falcon-monitor-compare').update(value).digest();
}

function safeEqual(a: string, b: string) {
  const aa = sha(a);
  const bb = sha(b);
  return aa.length === bb.length && timingSafeEqual(aa, bb);
}

export function verifyAccessKey(candidate: string) {
  const expected = process.env.MONITOR_ACCESS_KEY;
  if (!expected || !candidate) return false;
  return safeEqual(candidate, expected);
}

export function monitorSessionToken() {
  const accessKey = process.env.MONITOR_ACCESS_KEY;
  const sessionSecret = process.env.MONITOR_SESSION_SECRET || accessKey;
  if (!accessKey || !sessionSecret) return null;
  return createHmac('sha256', sessionSecret)
    .update(`falcon-hod-monitor:v1:${accessKey}`)
    .digest('hex');
}

export async function isMonitorAuthenticated() {
  const expected = monitorSessionToken();
  if (!expected) return false;
  const store = await cookies();
  const actual = store.get(MONITOR_COOKIE)?.value;
  if (!actual) return false;
  return safeEqual(actual, expected);
}

export async function requireMonitorAuth() {
  if (!(await isMonitorAuthenticated())) redirect('/login');
}
