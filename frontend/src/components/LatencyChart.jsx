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
      <div className="bg-[#292B24] border border-[#3D4136] p-2.5 rounded-xs shadow-md text-xs space-y-1 font-mono text-[#FAF8F2]">
        <div className="text-[#B3AFA5] text-[10px] uppercase tracking-wider">{dateStr} UTC</div>
        <div className="flex items-center gap-2">
          <span className="text-[#B3AFA5]">LATENCY:</span>
          <span className="font-semibold text-[#D84A2F]">{data.latencyMs} ms</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[#B3AFA5]">STATUS:</span>
          <span className={data.success ? 'text-[#B6C66B]' : 'text-[#C63E32]'}>
            {data.statusCode ? `HTTP ${data.statusCode}` : 'Check Failed'}
          </span>
        </div>
        {!data.success && data.errorCategory && (
          <div className="text-[#C63E32] text-[10px] pt-1 border-t border-[#3D4136]">
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
        className="w-full flex flex-col items-center justify-center bg-[#FAF8F2] border border-dashed border-[#D4CCBE] rounded-xs text-[#77766B] text-xs font-mono"
      >
        <span className="text-[#252720] font-medium">No telemetry data recorded</span>
        <span className="text-[11px] text-[#77766B] mt-0.5">
          Latency points will register as probes execute.
        </span>
      </div>
    );
  }

  const formattedData = data.map(d => ({
    ...d,
    timeLabel: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }));

  return (
    <div className="w-full bg-[#FAF8F2] border border-[#D4CCBE] rounded-xs p-4 shadow-2xs">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-[11px] font-mono tracking-wider text-[#77766B] uppercase font-semibold">
          Response Latency Trend &mdash; Last {data.length} Observations
        </span>
        <span className="text-[11px] font-mono text-[#77766B]">Unit: ms</span>
      </div>
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D84A2F" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#D84A2F" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 2" stroke="#E8E1D5" />
            <XAxis
              dataKey="timeLabel"
              stroke="#D4CCBE"
              tick={{ fontSize: 10, fill: '#77766B', fontFamily: 'JetBrains Mono' }}
              tickLine={false}
            />
            <YAxis
              stroke="#D4CCBE"
              tick={{ fontSize: 10, fill: '#77766B', fontFamily: 'JetBrains Mono' }}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="latencyMs"
              stroke="#D84A2F"
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
