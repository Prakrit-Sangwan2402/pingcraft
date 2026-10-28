import React from 'react';

export default function MetricCard({ title, value, subtext, icon: Icon, tone = 'default' }) {
  const toneClasses = {
    default: 'text-[#E8EDF4]',
    success: 'text-[#45D483]',
    warning: 'text-[#F2B866]',
    danger: 'text-[#FF647C]',
    brand: 'text-[#E8EDF4]'
  };

  return (
    <div className="bg-[#131A23] border border-[#263241] rounded-xl p-4 shadow-sm transition-colors hover:border-[#3DD6C6]/30">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-medium tracking-wider text-[#9AA8B8] uppercase">{title}</span>
        {Icon && <Icon className="w-4 h-4 text-[#687789]" />}
      </div>
      <div className={`text-2xl font-semibold tracking-tight font-mono tabular-nums ${toneClasses[tone] || toneClasses.default}`}>
        {value !== null && value !== undefined ? value : <span className="text-[#687789] font-sans text-sm font-normal">No data</span>}
      </div>
      {subtext && <p className="text-xs text-[#687789] mt-1">{subtext}</p>}
    </div>
  );
}
