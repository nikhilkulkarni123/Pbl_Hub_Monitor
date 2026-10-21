'use client';

import type { ReactNode } from 'react';

export default function MetricCard({
  label,
  value,
  detail,
  tone = 'default',
  icon,
  onClick,
  clickableHint = 'Click for details ↗',
}: {
  label: string;
  value: string | number;
  detail?: ReactNode;
  tone?: 'default' | 'good' | 'warn' | 'danger' | 'blue' | 'teal';
  icon?: string;
  onClick?: () => void;
  clickableHint?: string;
}) {
  const isClickable = Boolean(onClick);

  return (
    <article
      className={`metricCard tone-${tone} ${isClickable ? 'clickableMetricCard' : ''}`}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
    >
      <div className="metricTop">
        <span className="metricLabel">{label}</span>
        <div className="metricTopRight">
          {isClickable && <span className="metricClickHint">{clickableHint}</span>}
          {icon && <span className="metricIcon">{icon}</span>}
        </div>
      </div>
      <strong className="metricValue">{value}</strong>
      <div className="metricDetail">{detail}</div>
    </article>
  );
}
