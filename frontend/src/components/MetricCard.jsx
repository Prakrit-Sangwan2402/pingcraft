import React from 'react';

export default function MetricCard({ title, value, subtext, icon: Icon, tone = 'default' }) {
  const toneClasses = {
    default: 'text-zinc-100',
    success: 'text-emerald-400',
    warning: 'text-amber-400',
    danger: 'text-red-400',
    brand: 'text-zinc-100'
  };

  return (
    <div className="bg-[#12141a] border border-zinc-800/80 rounded-lg p-4 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-medium tracking-wide text-zinc-400 uppercase">{title}</span>
        {Icon && <Icon className="w-4 h-4 text-zinc-500" />}
      </div>
      <div className={`text-2xl font-semibold tracking-tight font-mono ${toneClasses[tone] || toneClasses.default}`}>
        {value !== null && value !== undefined ? value : <span className="text-zinc-600 font-sans text-sm font-normal">No data</span>}
      </div>
      {subtext && <p className="text-[11px] text-zinc-500 mt-1">{subtext}</p>}
    </div>
  );
}
