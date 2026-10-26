import React from 'react';

export default function MetricCard({ title, value, subtext, icon: Icon, tone = 'default' }) {
  const toneClasses = {
    default: 'text-slate-100',
    success: 'text-emerald-400',
    warning: 'text-amber-400',
    danger: 'text-rose-400',
    brand: 'text-indigo-400'
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</span>
        {Icon && (
          <div className="p-2 rounded-lg bg-slate-800/80 text-slate-300">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className={`text-2xl font-bold tracking-tight ${toneClasses[tone] || toneClasses.default}`}>
        {value !== null && value !== undefined ? value : <span className="text-slate-500 font-normal text-lg">No data</span>}
      </div>
      {subtext && <p className="text-xs text-slate-400 mt-1.5">{subtext}</p>}
    </div>
  );
}
