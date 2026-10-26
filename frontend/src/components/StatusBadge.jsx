import React from 'react';

export default function StatusBadge({ status, size = 'md' }) {
  const norm = (status || 'NO_DATA').toUpperCase();

  const configs = {
    OPERATIONAL: {
      bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      dot: 'bg-emerald-500',
      label: 'Operational'
    },
    DEGRADED: {
      bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      dot: 'bg-amber-500 animate-pulse',
      label: 'Degraded'
    },
    DOWN: {
      bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      dot: 'bg-rose-500 animate-ping',
      label: 'Major Outage'
    },
    PAUSED: {
      bg: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
      dot: 'bg-slate-400',
      label: 'Paused'
    },
    NO_DATA: {
      bg: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30',
      dot: 'bg-zinc-500',
      label: 'No Data'
    }
  };

  const current = configs[norm] || configs.NO_DATA;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs font-semibold';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${current.bg} ${sizeClasses}`}
    >
      <span className={`h-2 w-2 rounded-full ${current.dot}`} />
      <span>{current.label}</span>
    </span>
  );
}
