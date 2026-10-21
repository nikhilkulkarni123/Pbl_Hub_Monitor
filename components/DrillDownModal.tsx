'use client';

import { useEffect, useMemo, useState } from 'react';
import type {
  ApplicationDetailItem,
  GuideRequestDetailItem,
  MonitorFilters,
  ProjectDetailItem,
  ReviewTeamDetailItem,
  StudentDetailItem,
  TeamDetailItem,
  VerificationDetailItem,
} from '@/lib/types';
import StatusBadge from './StatusBadge';
import { formatDateTime } from '@/lib/format';

export type DrillDownType =
  | 'students'
  | 'teams'
  | 'projects'
  | 'applications'
  | 'guide-requests'
  | 'verifications'
  | 'review-teams';

export type DrillDownConfig = {
  type: DrillDownType;
  title: string;
  initialFilter?: string;
  reviewId?: number;
  reviewName?: string;
};

type Props = {
  isOpen: boolean;
  config: DrillDownConfig | null;
  filters: MonitorFilters;
  onClose: () => void;
};

export default function DrillDownModal({ isOpen, config, filters, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [expandedTeamId, setExpandedTeamId] = useState<number | null>(null);

  // Sync initial tab when config changes
  useEffect(() => {
    if (config?.initialFilter) {
      setActiveTab(config.initialFilter.toUpperCase());
    } else {
      setActiveTab('ALL');
    }
    setSearch('');
    setExpandedTeamId(null);
  }, [config]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Fetch data whenever modal opens with a config
  useEffect(() => {
    if (!isOpen || !config) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    const query = new URLSearchParams();
    query.set('type', config.type);
    if (filters.institution && filters.institution !== 'ALL') {
      query.set('institution', filters.institution);
    }
    if (filters.semester) {
      query.set('semester', String(filters.semester));
    }
    if (config.reviewId) {
      query.set('reviewId', String(config.reviewId));
    }

    fetch(`/api/details?${query.toString()}`)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Failed with status ${res.status}`);
        }
        return res.json();
      })
      .then((res) => {
        if (isMounted) {
          setData(res.items || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Error loading details');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, config, filters]);

  // Filtered dataset
  const filteredData = useMemo(() => {
    if (!config) return [];
    let list = [...data];

    // Filter by tab
    if (activeTab !== 'ALL') {
      if (config.type === 'students') {
        list = list.filter((s: StudentDetailItem) => s.assignmentStatus === activeTab);
      } else if (config.type === 'teams') {
        list = list.filter((t: TeamDetailItem) => t.allocationStatus === activeTab);
      } else if (config.type === 'projects') {
        if (activeTab === 'FACULTY_PROJECT' || activeTab === 'STUDENT_PROJECT') {
          list = list.filter((p: ProjectDetailItem) => p.projectType === activeTab);
        } else if (activeTab === 'ALLOCATED' || activeTab === 'UNALLOCATED') {
          list = list.filter((p: ProjectDetailItem) => p.allocationStatus === activeTab);
        }
      } else if (config.type === 'review-teams') {
        if (activeTab === 'SUBMITTED') {
          list = list.filter((r: ReviewTeamDetailItem) => r.submissionStatus === 'SUBMITTED');
        } else if (activeTab === 'PENDING') {
          list = list.filter((r: ReviewTeamDetailItem) => r.submissionStatus === 'PENDING');
        } else if (activeTab === 'EVALUATED') {
          list = list.filter((r: ReviewTeamDetailItem) => r.evaluationStatus && r.evaluationStatus !== 'PENDING_HOD_VERIFICATION');
        } else if (activeTab === 'PENDING_HOD') {
          list = list.filter((r: ReviewTeamDetailItem) => r.evaluationStatus === 'PENDING_HOD_VERIFICATION');
        } else if (activeTab === 'VERIFIED') {
          list = list.filter((r: ReviewTeamDetailItem) => r.evaluationStatus === 'VERIFIED');
        } else if (activeTab === 'RETURNED') {
          list = list.filter((r: ReviewTeamDetailItem) => r.evaluationStatus === 'RETURNED_FOR_CORRECTION');
        }
      }
    }

    // Search query
    const s = search.trim().toLowerCase();
    if (!s) return list;

    return list.filter((item) => {
      const flat = JSON.stringify(item).toLowerCase();
      return flat.includes(s);
    });
  }, [data, config, activeTab, search]);

  // Export filtered items to CSV
  const handleExportCsv = () => {
    if (!filteredData.length || !config) return;
    let headers: string[] = [];
    let rows: string[][] = [];

    if (config.type === 'students') {
      headers = ['Institution', 'Semester', 'Section', 'USN', 'Name', 'Status', 'Team Code', 'Team Name', 'Project Title', 'Guide'];
      rows = filteredData.map((s: StudentDetailItem) => [
        s.institution,
        String(s.semester),
        s.section,
        s.usn,
        s.name,
        s.assignmentStatus,
        s.teamCode ?? '',
        s.teamName ?? '',
        s.projectTitle ?? '',
        s.guideName ?? '',
      ]);
    } else if (config.type === 'teams') {
      headers = ['Institution', 'Semester', 'Team Code', 'Team Name', 'Members Count', 'Members', 'Allocation Status', 'Project Title', 'Guide'];
      rows = filteredData.map((t: TeamDetailItem) => [
        t.institution,
        String(t.semester),
        t.teamCode,
        t.teamName,
        String(t.members?.length ?? 0),
        t.members?.map((m) => `${m.usn} (${m.name})`).join('; ') ?? '',
        t.allocationStatus,
        t.projectTitle ?? '',
        t.guideName ?? '',
      ]);
    } else if (config.type === 'projects') {
      headers = ['Institution', 'Semester', 'Project Title', 'Type', 'Owner / Proposed By', 'Allocation', 'Team Code', 'Guide'];
      rows = filteredData.map((p: ProjectDetailItem) => [
        p.institution,
        String(p.semester),
        p.title,
        p.projectType,
        p.ownerFacultyName ?? '',
        p.allocationStatus,
        p.teamCode ?? '',
        p.guideFacultyName ?? '',
      ]);
    } else if (config.type === 'review-teams') {
      headers = ['Institution', 'Semester', 'Review', 'Team Code', 'Team Name', 'Submission Status', 'Submitted At', 'Evaluation Status', 'Guide'];
      rows = filteredData.map((r: ReviewTeamDetailItem) => [
        r.institution,
        String(r.semester),
        r.reviewName,
        r.teamCode,
        r.teamName,
        r.submissionStatus,
        r.submittedAt ?? '',
        r.evaluationStatus ?? 'NOT EVALUATED',
        r.guideName ?? '',
      ]);
    } else {
      headers = Object.keys(filteredData[0] || {});
      rows = filteredData.map((item) => headers.map((k) => String(item[k] ?? '')));
    }

    const csvContent = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `falcon-${config.type}-${activeTab.toLowerCase()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen || !config) return null;

  // Tabs by type
  let tabs: { id: string; label: string; count?: number }[] = [];
  if (config.type === 'students') {
    const assignedCount = data.filter((s: StudentDetailItem) => s.assignmentStatus === 'ASSIGNED').length;
    const unassignedCount = data.filter((s: StudentDetailItem) => s.assignmentStatus === 'UNASSIGNED').length;
    tabs = [
      { id: 'ALL', label: 'All Students', count: data.length },
      { id: 'ASSIGNED', label: 'Assigned', count: assignedCount },
      { id: 'UNASSIGNED', label: 'Unassigned', count: unassignedCount },
    ];
  } else if (config.type === 'teams') {
    const allocatedCount = data.filter((t: TeamDetailItem) => t.allocationStatus === 'ALLOCATED').length;
    const unallocatedCount = data.filter((t: TeamDetailItem) => t.allocationStatus === 'UNALLOCATED').length;
    tabs = [
      { id: 'ALL', label: 'All Teams', count: data.length },
      { id: 'ALLOCATED', label: 'Allocated Project', count: allocatedCount },
      { id: 'UNALLOCATED', label: 'Unallocated', count: unallocatedCount },
    ];
  } else if (config.type === 'projects') {
    const facCount = data.filter((p: ProjectDetailItem) => p.projectType === 'FACULTY_PROJECT').length;
    const stuCount = data.filter((p: ProjectDetailItem) => p.projectType === 'STUDENT_PROJECT').length;
    const allocCount = data.filter((p: ProjectDetailItem) => p.allocationStatus === 'ALLOCATED').length;
    tabs = [
      { id: 'ALL', label: 'All Projects', count: data.length },
      { id: 'FACULTY_PROJECT', label: 'Faculty Projects', count: facCount },
      { id: 'STUDENT_PROJECT', label: 'Student Projects', count: stuCount },
      { id: 'ALLOCATED', label: 'Allocated', count: allocCount },
    ];
  } else if (config.type === 'review-teams') {
    const submittedCount = data.filter((r: ReviewTeamDetailItem) => r.submissionStatus === 'SUBMITTED').length;
    const pendingCount = data.filter((r: ReviewTeamDetailItem) => r.submissionStatus === 'PENDING').length;
    const evaluatedCount = data.filter((r: ReviewTeamDetailItem) => r.evaluationStatus && r.evaluationStatus !== 'PENDING_HOD_VERIFICATION').length;
    const pendingHodCount = data.filter((r: ReviewTeamDetailItem) => r.evaluationStatus === 'PENDING_HOD_VERIFICATION').length;
    const verifiedCount = data.filter((r: ReviewTeamDetailItem) => r.evaluationStatus === 'VERIFIED').length;
    tabs = [
      { id: 'ALL', label: 'All Teams', count: data.length },
      { id: 'SUBMITTED', label: 'Submitted', count: submittedCount },
      { id: 'PENDING', label: 'Pending Submission', count: pendingCount },
      { id: 'EVALUATED', label: 'Faculty Evaluated', count: evaluatedCount },
      { id: 'PENDING_HOD', label: 'Pending HoD', count: pendingHodCount },
      { id: 'VERIFIED', label: 'Verified', count: verifiedCount },
    ];
  }

  return (
    <div className="drillDownBackdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="drillDownDrawer" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="drillDownHeader">
          <div>
            <div className="drillDownScopeBadgeRow">
              <span className="scopePillMini">
                {filters.institution === 'ALL' ? 'All Institutions' : filters.institution}
                {filters.semester ? ` • Semester ${filters.semester}` : ''}
              </span>
              {config.reviewName && <span className="scopePillMini reviewPillMini">{config.reviewName}</span>}
              <span className="badgeCounter">{filteredData.length} records</span>
            </div>
            <h2>{config.title}</h2>
          </div>
          <button className="drillDownCloseBtn" onClick={onClose} title="Close (Esc)">
            ✕
          </button>
        </div>

        {/* Tabs Bar */}
        {tabs.length > 0 && (
          <div className="drillDownTabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`drillDownTab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && <small className="tabCount">{tab.count}</small>}
              </button>
            ))}
          </div>
        )}

        {/* Controls Toolbar: Search & CSV Export */}
        <div className="drillDownToolbar">
          <div className="drillDownSearchWrap">
            <span className="searchIcon">🔍</span>
            <input
              type="text"
              placeholder={`Search by name, USN, team, guide, project...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="drillDownSearchInput"
            />
            {search && (
              <button className="searchClearBtn" onClick={() => setSearch('')}>
                ✕
              </button>
            )}
          </div>
          <button className="drillDownExportBtn" onClick={handleExportCsv} disabled={filteredData.length === 0}>
            📥 Export CSV
          </button>
        </div>

        {/* Content Body */}
        <div className="drillDownBody">
          {loading && (
            <div className="drillDownLoading">
              <div className="spinner" />
              <p>Fetching real-time records from live database...</p>
            </div>
          )}

          {error && (
            <div className="drillDownError">
              <strong>Error loading details</strong>
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && filteredData.length === 0 && (
            <div className="emptyState">
              No matching records found for this view{search ? ` matching "${search}"` : ''}.
            </div>
          )}

          {!loading && !error && filteredData.length > 0 && (
            <div className="tableWrap drillDownTableWrap">
              {/* STUDENTS TABLE */}
              {config.type === 'students' && (
                <table className="drillDownTable">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>USN</th>
                      <th>Class</th>
                      <th>Assignment Status</th>
                      <th>Allocated Team</th>
                      <th>Project & Guide</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(filteredData as StudentDetailItem[]).map((s) => (
                      <tr key={`${s.institution}-${s.usn}`}>
                        <td>
                          <strong>{s.name}</strong>
                          <span className="subCell">{s.institution}</span>
                        </td>
                        <td>
                          <span className="codePill">{s.usn}</span>
                        </td>
                        <td>
                          <span>Sem {s.semester}</span>
                          <span className="subCell">Sec {s.section}</span>
                        </td>
                        <td>
                          <StatusBadge tone={s.assignmentStatus === 'ASSIGNED' ? 'good' : 'danger'}>
                            {s.assignmentStatus}
                          </StatusBadge>
                        </td>
                        <td>
                          {s.teamCode ? (
                            <div>
                              <strong className="teamCodeHighlight">{s.teamCode}</strong>
                              <span className="subCell">{s.teamName}</span>
                            </div>
                          ) : (
                            <span className="mutedText">— None —</span>
                          )}
                        </td>
                        <td>
                          {s.projectTitle ? (
                            <div>
                              <span className="projectTitleText" title={s.projectTitle}>
                                {s.projectTitle}
                              </span>
                              {s.guideName && <span className="subCell">Guide: {s.guideName}</span>}
                            </div>
                          ) : (
                            <span className="mutedText">— No Project —</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* TEAMS TABLE */}
              {config.type === 'teams' && (
                <table className="drillDownTable">
                  <thead>
                    <tr>
                      <th>Team</th>
                      <th>Scope</th>
                      <th>Members ({data.reduce((acc, t) => acc + (t.members?.length || 0), 0)} total)</th>
                      <th>Project Allocation</th>
                      <th>Guide Faculty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(filteredData as TeamDetailItem[]).map((t) => {
                      const isExpanded = expandedTeamId === t.teamId;
                      return (
                        <tr key={`${t.institution}-${t.teamCode}`}>
                          <td>
                            <strong className="teamCodeHighlight">{t.teamCode}</strong>
                            <span className="subCell">{t.teamName}</span>
                          </td>
                          <td>
                            <StatusBadge tone={t.institution === 'GMIT' ? 'info' : 'neutral'}>
                              {t.institution}
                            </StatusBadge>
                            <span className="subCell">Sem {t.semester}</span>
                          </td>
                          <td>
                            <div className="memberCell">
                              <button
                                className="memberToggleBtn"
                                onClick={() => setExpandedTeamId(isExpanded ? null : t.teamId)}
                              >
                                👥 {t.members?.length || 0} Members {isExpanded ? '▲' : '▼'}
                              </button>
                              {isExpanded && (
                                <div className="memberChipList">
                                  {t.members?.map((m) => (
                                    <div key={m.usn} className="memberChip">
                                      <strong>{m.name}</strong>
                                      <small>{m.usn} {m.section ? `• ${m.section}` : ''}</small>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <StatusBadge tone={t.allocationStatus === 'ALLOCATED' ? 'good' : 'warn'}>
                              {t.allocationStatus}
                            </StatusBadge>
                            {t.projectTitle && (
                              <span className="projectTitleText subCell" title={t.projectTitle}>
                                {t.projectTitle}
                              </span>
                            )}
                          </td>
                          <td>
                            {t.guideName ? (
                              <strong>{t.guideName}</strong>
                            ) : (
                              <span className="mutedText">— Pending Guide —</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {/* PROJECTS TABLE */}
              {config.type === 'projects' && (
                <table className="drillDownTable">
                  <thead>
                    <tr>
                      <th>Project Title</th>
                      <th>Type</th>
                      <th>Proposed / Owner</th>
                      <th>Allocated Team</th>
                      <th>Guide Faculty</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(filteredData as ProjectDetailItem[]).map((p) => (
                      <tr key={`${p.institution}-${p.projectId}`}>
                        <td>
                          <strong>{p.title}</strong>
                          <span className="subCell">{p.institution} • Sem {p.semester}</span>
                        </td>
                        <td>
                          <StatusBadge tone={p.projectType === 'FACULTY_PROJECT' ? 'info' : 'good'}>
                            {p.projectType === 'FACULTY_PROJECT' ? 'FACULTY' : 'STUDENT'}
                          </StatusBadge>
                        </td>
                        <td>
                          <span>{p.ownerFacultyName || 'Student Proposed'}</span>
                        </td>
                        <td>
                          {p.teamCode ? (
                            <div>
                              <strong className="teamCodeHighlight">{p.teamCode}</strong>
                              <span className="subCell">{p.teamName}</span>
                            </div>
                          ) : (
                            <StatusBadge tone="warn">UNALLOCATED</StatusBadge>
                          )}
                        </td>
                        <td>
                          <span>{p.guideFacultyName || '—'}</span>
                        </td>
                        <td>
                          <StatusBadge tone={p.status === 'PUBLISHED' ? 'good' : 'neutral'}>
                            {p.status}
                          </StatusBadge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* REVIEW TEAMS TABLE */}
              {config.type === 'review-teams' && (
                <table className="drillDownTable">
                  <thead>
                    <tr>
                      <th>Team</th>
                      <th>Members</th>
                      <th>Project & Guide</th>
                      <th>Submission Status</th>
                      <th>Faculty Evaluation</th>
                      <th>HoD Verification</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(filteredData as ReviewTeamDetailItem[]).map((r) => (
                      <tr key={`${r.institution}-${r.reviewId}-${r.teamCode}`}>
                        <td>
                          <strong className="teamCodeHighlight">{r.teamCode}</strong>
                          <span className="subCell">{r.teamName}</span>
                        </td>
                        <td>
                          <span className="badgePill">👥 {r.members?.length || 0} students</span>
                          <span className="subCell">
                            {r.members?.map((m) => m.name.split(' ')[0]).slice(0, 3).join(', ')}
                            {(r.members?.length || 0) > 3 ? '...' : ''}
                          </span>
                        </td>
                        <td>
                          <span className="projectTitleText" title={r.projectTitle ?? ''}>
                            {r.projectTitle || '—'}
                          </span>
                          <span className="subCell">Guide: {r.guideName || '—'}</span>
                        </td>
                        <td>
                          <StatusBadge tone={r.submissionStatus === 'SUBMITTED' ? 'good' : 'danger'}>
                            {r.submissionStatus}
                          </StatusBadge>
                          {r.submittedAt && (
                            <span className="subCell">{formatDateTime(r.submittedAt)}</span>
                          )}
                        </td>
                        <td>
                          <StatusBadge
                            tone={
                              r.evaluationStatus === 'VERIFIED' || r.evaluationStatus === 'SUBMITTED'
                                ? 'good'
                                : r.evaluationStatus === 'PENDING_HOD_VERIFICATION'
                                ? 'warn'
                                : r.evaluationStatus === 'RETURNED_FOR_CORRECTION'
                                ? 'danger'
                                : 'neutral'
                            }
                          >
                            {r.evaluationStatus || 'NOT EVALUATED'}
                          </StatusBadge>
                          {r.evaluatedAt && (
                            <span className="subCell">{formatDateTime(r.evaluatedAt)}</span>
                          )}
                        </td>
                        <td>
                          <StatusBadge
                            tone={
                              r.evaluationStatus === 'VERIFIED'
                                ? 'good'
                                : r.evaluationStatus === 'PENDING_HOD_VERIFICATION'
                                ? 'warn'
                                : 'neutral'
                            }
                          >
                            {r.evaluationStatus === 'VERIFIED'
                              ? 'VERIFIED'
                              : r.evaluationStatus === 'PENDING_HOD_VERIFICATION'
                              ? 'PENDING HOD'
                              : '—'}
                          </StatusBadge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* APPLICATIONS TABLE */}
              {config.type === 'applications' && (
                <table className="drillDownTable">
                  <thead>
                    <tr>
                      <th>Team</th>
                      <th>Project Title</th>
                      <th>Faculty Owner</th>
                      <th>Applied Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(filteredData as ApplicationDetailItem[]).map((a) => (
                      <tr key={a.applicationId}>
                        <td>
                          <strong className="teamCodeHighlight">{a.teamCode}</strong>
                          <span className="subCell">{a.teamName}</span>
                        </td>
                        <td><strong>{a.projectTitle}</strong></td>
                        <td>{a.facultyName || '—'}</td>
                        <td>{formatDateTime(a.appliedAt)}</td>
                        <td><StatusBadge tone="warn">{a.status}</StatusBadge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* GUIDE REQUESTS TABLE */}
              {config.type === 'guide-requests' && (
                <table className="drillDownTable">
                  <thead>
                    <tr>
                      <th>Team</th>
                      <th>Project Title</th>
                      <th>Requested Faculty</th>
                      <th>Requested Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(filteredData as GuideRequestDetailItem[]).map((g) => (
                      <tr key={g.requestId}>
                        <td>
                          <strong className="teamCodeHighlight">{g.teamCode}</strong>
                          <span className="subCell">{g.teamName}</span>
                        </td>
                        <td><strong>{g.projectTitle}</strong></td>
                        <td>{g.requestedFacultyName || '—'}</td>
                        <td>{formatDateTime(g.requestedAt)}</td>
                        <td><StatusBadge tone="warn">{g.status}</StatusBadge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* HOD VERIFICATIONS TABLE */}
              {config.type === 'verifications' && (
                <table className="drillDownTable">
                  <thead>
                    <tr>
                      <th>Review</th>
                      <th>Team</th>
                      <th>Guide Faculty</th>
                      <th>Submitted Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(filteredData as VerificationDetailItem[]).map((v) => (
                      <tr key={v.evaluationId}>
                        <td><strong>{v.reviewName}</strong><span className="subCell">Sem {v.semester}</span></td>
                        <td>
                          <strong className="teamCodeHighlight">{v.teamCode}</strong>
                          <span className="subCell">{v.teamName}</span>
                        </td>
                        <td>{v.facultyName}</td>
                        <td>{formatDateTime(v.submittedAt)}</td>
                        <td><StatusBadge tone="danger">{v.status}</StatusBadge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
