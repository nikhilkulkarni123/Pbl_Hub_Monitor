import type { Institution, MonitorFilters } from './types';

export function parseFilters(input: { institution?: string; semester?: string }): MonitorFilters {
  const rawInstitution = (input.institution ?? 'ALL').toUpperCase();
  const institution: Institution = rawInstitution === 'GMU' || rawInstitution === 'GMIT' ? rawInstitution : 'ALL';
  const rawSemester = Number(input.semester);
  const semester = [3, 5, 7].includes(rawSemester) ? rawSemester : null;
  return { institution, semester };
}

export function filterQuery(filters: MonitorFilters) {
  const params = new URLSearchParams();
  if (filters.institution !== 'ALL') params.set('institution', filters.institution);
  if (filters.semester) params.set('semester', String(filters.semester));
  const q = params.toString();
  return q ? `?${q}` : '';
}

export function scopeLabel(filters: MonitorFilters) {
  const institution = filters.institution === 'ALL' ? 'GMU + GMIT' : filters.institution;
  const semester = filters.semester ? `Semester ${filters.semester}` : 'All semesters';
  return `${institution} • ${semester}`;
}
