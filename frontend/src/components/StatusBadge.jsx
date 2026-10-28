import React from 'react';

export default function StatusBadge({ status, size = 'md' }) {
  const norm = (status || 'NO_DATA').toUpperCase();

  const configs = {
    OPERATIONAL: {
      bg: 'bg-[#427A55]/10 text-[#427A55] border-[#427A55]/30',
      dot: 'bg-[#427A55]',
      label: 'Operational'
    },
    DEGRADED: {
      bg: 'bg-[#C17B27]/10 text-[#C17B27] border-[#C17B27]/30',
      dot: 'bg-[#C17B27]',
      label: 'Degraded'
    },
    DOWN: {
      bg: 'bg-[#C63E32]/10 text-[#C63E32] border-[#C63E32]/30',
      dot: 'bg-[#C63E32]',
      label: 'Outage'
    },
    PAUSED: {
      bg: 'bg-[#E8E1D5] text-[#77766B] border-[#D4CCBE]',
      dot: 'bg-[#77766B]',
      label: 'Paused'
    },
    NO_DATA: {
      bg: 'bg-[#FAF8F2] text-[#77766B] border-[#D4CCBE]',
      dot: 'bg-[#77766B]',
      label: 'No data'
    }
  };

  const current = configs[norm] || configs.NO_DATA;
  const isSm = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-xs border font-mono tracking-tight font-medium ${
        isSm ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
      } ${current.bg}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${current.dot}`} />
      <span>{current.label}</span>
    </span>
  );
}
