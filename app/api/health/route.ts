import { NextResponse } from 'next/server';
import { pingDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (process.env.DEMO_MODE === 'true') {
      return NextResponse.json({ ok: true, mode: 'demo', service: 'falcon-hod-live-monitor' });
    }
    const databaseTime = await pingDatabase();
    return NextResponse.json({ ok: true, service: 'falcon-hod-live-monitor', databaseTime });
  } catch (error) {
    console.error('Health check pingDatabase error:', error);
    return NextResponse.json({ ok: false, service: 'falcon-hod-live-monitor' }, { status: 503 });
  }
}
