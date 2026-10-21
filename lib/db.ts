import { Pool, type QueryResultRow } from 'pg';

const globalForDb = globalThis as unknown as { falconMonitorPool?: Pool };

function cloudSsl() {
  const url = process.env.DATABASE_URL ?? '';
  return url.includes('neon.tech') || url.includes('supabase') || url.includes('sslmode=require') || process.env.NODE_ENV === 'production';
}

export const pool = globalForDb.falconMonitorPool ?? new Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.DB_POOL_MAX || 4),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 15_000,
  keepAlive: true,
  ssl: cloudSsl() ? { rejectUnauthorized: false } : undefined,
  application_name: 'falcon-hod-live-monitor',
  options: '-c default_transaction_read_only=on',
});

globalForDb.falconMonitorPool = pool;

function assertReadOnlySql(text: string) {
  const cleaned = text.trim().replace(/^\/\*[\s\S]*?\*\//, '').trim().toUpperCase();
  if (!(cleaned.startsWith('SELECT') || cleaned.startsWith('WITH') || cleaned.startsWith('SHOW'))) {
    throw new Error('Falcon HoD Monitor blocks non-read-only SQL.');
  }
}

export async function readQuery<T extends QueryResultRow>(text: string, params: unknown[] = []): Promise<T[]> {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured.');
  assertReadOnlySql(text);
  const result = await pool.query<T>(text, params);
  return result.rows;
}

export async function pingDatabase() {
  const rows = await readQuery<{ now: string }>('SELECT NOW()::text AS now');
  return rows[0]?.now ?? null;
}
