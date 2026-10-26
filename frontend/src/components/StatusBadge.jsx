import React from 'react';

export default function StatusBadge({ status, size = 'md' }) {
  const norm = (status || 'NO_DATA').toUpperCase();

  const configs = {
    OPERATIONAL: {
      bg: 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40',
      dot: 'bg-emerald-400',
      label: 'Operational'
    },
    DEGRADED: {
      bg: 'bg-amber-950/40 text-amber-400 border-amber-800/40',
      dot: 'bg-amber-400',
      label: 'Degraded'
    },
    DOWN: {
      bg: 'bg-red-950/40 text-red-400 border-red-800/40',
      dot: 'bg-red-400',
      label: 'Outage'
    },
    PAUSED: {
      bg: 'bg-zinc-900 text-zinc-400 border-zinc-800',
      dot: 'bg-zinc-500',
      label: 'Paused'
    },
    NO_DATA: {
      bg: 'bg-zinc-900 text-zinc-500 border-zinc-800',
      dot: 'bg-zinc-600',
      label: 'No data'
    }
  };

  const current = configs[norm] || configs.NO_DATA;
  const isSm = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border font-medium tracking-tight ${
        isSm ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
      } ${current.bg}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${current.dot}`} />
      <span>{current.label}</span>
    </span>
  );
}
