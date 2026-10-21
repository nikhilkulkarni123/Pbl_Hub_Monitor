import { NextResponse } from 'next/server';
import { MONITOR_COOKIE, SESSION_MAX_AGE, monitorSessionToken, verifyAccessKey } from '@/lib/auth';

export async function POST(request: Request) {
  const form = await request.formData();
  const accessKey = String(form.get('accessKey') ?? '');

  if (!process.env.MONITOR_ACCESS_KEY) {
    return NextResponse.redirect(new URL('/login?error=config', request.url), 303);
  }
  if (!verifyAccessKey(accessKey)) {
    await new Promise((resolve) => setTimeout(resolve, 350));
    return NextResponse.redirect(new URL('/login?error=invalid', request.url), 303);
  }
  const token = monitorSessionToken();
  if (!token) return NextResponse.redirect(new URL('/login?error=config', request.url), 303);

  const response = NextResponse.redirect(new URL('/', request.url), 303);
  response.cookies.set(MONITOR_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
  response.headers.set('Cache-Control', 'no-store');
  return response;
}
