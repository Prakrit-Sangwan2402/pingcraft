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
    <div className="bg-[#12141c] border border-zinc-800 rounded-xl p-5 shadow-sm transition-all hover:border-zinc-700">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">{title}</span>
        {Icon && <Icon className="w-5 h-5 text-zinc-500" />}
      </div>
      <div className={`text-3xl font-bold tracking-tight font-mono ${toneClasses[tone] || toneClasses.default}`}>
        {value !== null && value !== undefined ? value : <span className="text-zinc-600 font-sans text-base font-normal">No data</span>}
      </div>
      {subtext && <p className="text-xs text-zinc-400 mt-1.5">{subtext}</p>}
    </div>
  );
}
