import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const dateStr = new Date(data.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    return (
      <div className="bg-slate-900 border border-slate-700/80 p-3 rounded-lg shadow-xl text-xs space-y-1">
        <div className="text-slate-400 font-mono">{dateStr}</div>
        <div className="flex items-center gap-2">
          <span className="text-slate-300">Latency:</span>
          <span className="font-semibold text-emerald-400 font-mono">{data.latencyMs} ms</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-300">Status:</span>
          <span className={`font-mono font-medium ${data.success ? 'text-emerald-400' : 'text-rose-400'}`}>
            {data.statusCode ? `HTTP ${data.statusCode}` : 'Connection Failed'}
          </span>
        </div>
        {!data.success && data.errorCategory && (
          <div className="text-rose-400 text-[11px] pt-1 border-t border-slate-800">
            {data.errorCategory}
          </div>
        )}
      </div>
    );
  }
  return null;
}

export default function LatencyChart({ data = [], height = 260 }) {
  if (!data || data.length === 0) {
    return (
      <div
        style={{ height }}
        className="w-full flex flex-col items-center justify-center bg-slate-900/40 border border-dashed border-slate-800 rounded-xl text-slate-500 text-sm"
      >
        <span className="text-slate-400 font-medium">No telemetry recorded yet</span>
        <span className="text-xs text-slate-600 mt-1">
          Historical latency will appear here as scheduled checks execute.
        </span>
      </div>
    );
  }

  // Format timestamp for X-Axis tick
  const formattedData = data.map(d => ({
    ...d,
    timeLabel: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }));

  return (
    <div className="w-full bg-slate-900/60 border border-slate-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Response Latency Trend (Last {data.length} checks)
        </span>
        <span className="text-xs font-mono text-emerald-400">Unit: Milliseconds (ms)</span>
      </div>
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="timeLabel"
              stroke="#64748b"
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickLine={false}
            />
            <YAxis
              stroke="#64748b"
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="latencyMs"
              stroke="#818cf8"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#latencyGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
