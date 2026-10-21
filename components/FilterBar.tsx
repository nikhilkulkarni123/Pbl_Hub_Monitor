import type { MonitorFilters } from '@/lib/types';
import { scopeLabel } from '@/lib/filters';

export default function FilterBar({ filters }: { filters: MonitorFilters }) {
  return (
    <section className="filterBar">
      <form method="get" className="filtersForm">
        <label>
          <span>Institution</span>
          <select name="institution" defaultValue={filters.institution}>
            <option value="ALL">GMU + GMIT</option>
            <option value="GMU">GMU</option>
            <option value="GMIT">GMIT</option>
          </select>
        </label>
        <label>
          <span>Semester</span>
          <select name="semester" defaultValue={filters.semester?.toString() ?? 'ALL'}>
            <option value="ALL">All semesters</option>
            <option value="3">Semester 3</option>
            <option value="5">Semester 5</option>
            <option value="7">Semester 7</option>
          </select>
        </label>
        <button type="submit" className="primaryButton">Apply filters</button>
      </form>
      <div className="scopePill">{scopeLabel(filters)}</div>
    </section>
  );
}
