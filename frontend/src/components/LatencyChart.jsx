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

function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const dateStr = new Date(data.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    return (
      <div className="bg-[#0b0d12] border border-zinc-700 p-2.5 rounded shadow-xl text-xs space-y-1 font-mono">
        <div className="text-zinc-500 text-[10px]">{dateStr}</div>
        <div className="flex items-center gap-2">
          <span className="text-zinc-400">Latency:</span>
          <span className="font-semibold text-emerald-400">{data.latencyMs} ms</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-zinc-400">Status:</span>
          <span className={data.success ? 'text-emerald-400' : 'text-red-400'}>
            {data.statusCode ? `HTTP ${data.statusCode}` : 'Check Failed'}
          </span>
        </div>
        {!data.success && data.errorCategory && (
          <div className="text-red-400 text-[10px] pt-1 border-t border-zinc-800">
            {data.errorCategory}
          </div>
        )}
      </div>
    );
  }
  return null;
}

export default function LatencyChart({ data = [], height = 250 }) {
  if (!data || data.length === 0) {
    return (
      <div
        style={{ height }}
        className="w-full flex flex-col items-center justify-center bg-[#12141a]/40 border border-dashed border-zinc-800 rounded-lg text-zinc-500 text-xs"
      >
        <span className="text-zinc-400 font-medium">No telemetry data recorded</span>
        <span className="text-[11px] text-zinc-600 mt-0.5">
          Latency points will populate as probes execute.
        </span>
      </div>
    );
  }

  const formattedData = data.map(d => ({
    ...d,
    timeLabel: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }));

  return (
    <div className="w-full bg-[#12141a] border border-zinc-800/80 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide">
          Response Latency Trend (Last {data.length} checks)
        </span>
        <span className="text-[11px] font-mono text-zinc-400">Unit: ms</span>
      </div>
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#34d399" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#34d399" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f242e" />
            <XAxis
              dataKey="timeLabel"
              stroke="#52525b"
              tick={{ fontSize: 10, fill: '#71717a' }}
              tickLine={false}
            />
            <YAxis
              stroke="#52525b"
              tick={{ fontSize: 10, fill: '#71717a' }}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="latencyMs"
              stroke="#10b981"
              strokeWidth={1.5}
              fillOpacity={1}
              fill="url(#latencyGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
