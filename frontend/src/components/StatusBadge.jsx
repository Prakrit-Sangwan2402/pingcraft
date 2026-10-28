import React from 'react';

export default function StatusBadge({ status, size = 'md' }) {
  const norm = (status || 'NO_DATA').toUpperCase();

  const configs = {
    OPERATIONAL: {
      bg: 'bg-[#45D483]/10 text-[#45D483] border-[#45D483]/25',
      dot: 'bg-[#45D483]',
      label: 'Operational'
    },
    DEGRADED: {
      bg: 'bg-[#F2B866]/10 text-[#F2B866] border-[#F2B866]/25',
      dot: 'bg-[#F2B866]',
      label: 'Degraded'
    },
    DOWN: {
      bg: 'bg-[#FF647C]/10 text-[#FF647C] border-[#FF647C]/25',
      dot: 'bg-[#FF647C]',
      label: 'Outage'
    },
    PAUSED: {
      bg: 'bg-[#8592A3]/10 text-[#8592A3] border-[#8592A3]/25',
      dot: 'bg-[#8592A3]',
      label: 'Paused'
    },
    NO_DATA: {
      bg: 'bg-[#192330] text-[#9AA8B8] border-[#263241]',
      dot: 'bg-[#687789]',
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
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${current.dot}`} />
      <span>{current.label}</span>
    </span>
  );
}
