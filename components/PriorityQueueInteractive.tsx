'use client';

import { useDrillDown } from './DrillDownContext';
import StatusBadge from './StatusBadge';
import type { AttentionItem } from '@/lib/types';

function attentionTone(level: string) {
  return level === 'critical' ? 'danger' : level === 'warning' ? 'warn' : level === 'ok' ? 'good' : 'info';
}

export default function PriorityQueueInteractive({ items }: { items: AttentionItem[] }) {
  const { openDrillDown } = useDrillDown();

  const handleItemClick = (item: AttentionItem) => {
    const titleLower = item.title.toLowerCase();
    if (titleLower.includes('student') && titleLower.includes('without team')) {
      openDrillDown({
        type: 'students',
        title: 'Unassigned Students — Priority Queue',
        initialFilter: 'UNASSIGNED',
      });
    } else if (titleLower.includes('team') && titleLower.includes('project')) {
      openDrillDown({
        type: 'teams',
        title: 'Unallocated Teams — Priority Queue',
        initialFilter: 'UNALLOCATED',
      });
    } else if (titleLower.includes('review') && titleLower.includes('submission')) {
      openDrillDown({
        type: 'review-teams',
        title: 'Pending Review Submissions — Priority Queue',
        initialFilter: 'PENDING',
      });
    } else if (titleLower.includes('hod') || titleLower.includes('verification')) {
      openDrillDown({
        type: 'verifications',
        title: 'Pending HoD Verifications — Priority Queue',
      });
    } else if (titleLower.includes('guide')) {
      openDrillDown({
        type: 'guide-requests',
        title: 'Pending Guide Requests — Priority Queue',
      });
    } else if (titleLower.includes('application')) {
      openDrillDown({
        type: 'applications',
        title: 'Pending Project Applications — Priority Queue',
      });
    } else {
      openDrillDown({
        type: 'students',
        title: item.title,
      });
    }
  };

  return (
    <div className="attentionGrid">
      {items.slice(0, 8).map((item) => (
        <div
          key={`${item.title}-${item.level}`}
          className={`attentionCard ${attentionTone(item.level)} clickableAttentionCard`}
          onClick={() => handleItemClick(item)}
          role="button"
          tabIndex={0}
          title="Click to view full details"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleItemClick(item);
            }
          }}
        >
          <div>
            <StatusBadge tone={attentionTone(item.level) as 'neutral' | 'good' | 'warn' | 'danger' | 'info'}>
              {item.level.toUpperCase()} ↗
            </StatusBadge>
            <h3>{item.title}</h3>
            <p>{item.detail}</p>
          </div>
          <strong>{item.count}</strong>
        </div>
      ))}
    </div>
  );
}
