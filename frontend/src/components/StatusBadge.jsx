import React from 'react';

export default function StatusBadge({ status, size = 'md' }) {
  const norm = (status || 'NO_DATA').toUpperCase();

  const configs = {
    OPERATIONAL: {
      bg: 'bg-emerald-950/50 text-emerald-400 border-emerald-700/50',
      dot: 'bg-emerald-400',
      label: 'Operational'
    },
    DEGRADED: {
      bg: 'bg-amber-950/50 text-amber-400 border-amber-700/50',
      dot: 'bg-amber-400',
      label: 'Degraded'
    },
    DOWN: {
      bg: 'bg-red-950/50 text-red-400 border-red-700/50',
      dot: 'bg-red-400',
      label: 'Outage'
    },
    PAUSED: {
      bg: 'bg-zinc-900 text-zinc-300 border-zinc-700',
      dot: 'bg-zinc-400',
      label: 'Paused'
    },
    NO_DATA: {
      bg: 'bg-zinc-900 text-zinc-400 border-zinc-750',
      dot: 'bg-zinc-500',
      label: 'No data'
    }
  };

  const current = configs[norm] || configs.NO_DATA;
  const isSm = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-md border font-semibold tracking-tight ${
        isSm ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-xs'
      } ${current.bg}`}
    >
      <span className={`h-2 w-2 rounded-full ${current.dot}`} />
      <span>{current.label}</span>
    </span>
  );
}
