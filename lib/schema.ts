import { readQuery } from './db';
import type { DatabaseProfile } from './types';

let cached: DatabaseProfile | null = null;

export async function detectDatabaseProfile(): Promise<DatabaseProfile> {
  if (cached) return cached;
  const rows = await readQuery<{
    has_gmit_v5: boolean;
    has_public_institution_column: boolean;
  }>(`
    SELECT
      to_regclass('gmit_v5.students_v2') IS NOT NULL AS has_gmit_v5,
      EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema='public'
          AND table_name='students_v2'
          AND column_name='institution'
      ) AS has_public_institution_column
  `);
  cached = {
    hasGmitV5: Boolean(rows[0]?.has_gmit_v5),
    hasPublicInstitutionColumn: Boolean(rows[0]?.has_public_institution_column),
  };
  return cached;
}
