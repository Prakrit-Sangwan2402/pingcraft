import React from 'react';

export default function MetricCard({ title, value, subtext, icon: Icon, tone = 'default' }) {
  const toneClasses = {
    default: 'text-[#252720]',
    success: 'text-[#427A55]',
    warning: 'text-[#C17B27]',
    danger: 'text-[#C63E32]',
    brand: 'text-[#252720]'
  };

  return (
    <div className="bg-[#FAF8F2] border border-[#D4CCBE] rounded-xs p-4 shadow-2xs transition-colors hover:border-[#77766B] relative">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-mono tracking-wider text-[#77766B] uppercase">{title}</span>
        {Icon && <Icon className="w-3.5 h-3.5 text-[#77766B]" />}
      </div>
      <div className={`text-2xl font-mono tabular-nums font-semibold tracking-tight ${toneClasses[tone] || toneClasses.default}`}>
        {value !== null && value !== undefined ? value : <span className="text-[#77766B] font-sans text-sm font-normal">No data</span>}
      </div>
      {subtext && <p className="text-[11px] font-mono text-[#77766B] mt-1 truncate">{subtext}</p>}
    </div>
  );
}
