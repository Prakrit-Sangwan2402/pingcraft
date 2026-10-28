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
      <div className="bg-[#192330] border border-[#263241] p-2.5 rounded-lg shadow-xl text-xs space-y-1 font-mono text-[#E8EDF4]">
        <div className="text-[#687789] text-[10px]">{dateStr}</div>
        <div className="flex items-center gap-2">
          <span className="text-[#9AA8B8]">Latency:</span>
          <span className="font-semibold text-[#3DD6C6]">{data.latencyMs} ms</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[#9AA8B8]">Status:</span>
          <span className={data.success ? 'text-[#45D483]' : 'text-[#FF647C]'}>
            {data.statusCode ? `HTTP ${data.statusCode}` : 'Check Failed'}
          </span>
        </div>
        {!data.success && data.errorCategory && (
          <div className="text-[#FF647C] text-[10px] pt-1 border-t border-[#1D2733]">
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
        className="w-full flex flex-col items-center justify-center bg-[#131A23]/40 border border-dashed border-[#263241] rounded-xl text-[#687789] text-xs"
      >
        <span className="text-[#9AA8B8] font-medium">No telemetry data recorded</span>
        <span className="text-[11px] text-[#687789] mt-0.5">
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
    <div className="w-full bg-[#131A23] border border-[#263241] rounded-xl p-4">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-[11px] font-medium text-[#9AA8B8] uppercase tracking-wide">
          Response Latency Trend (Last {data.length} checks)
        </span>
        <span className="text-[11px] font-mono text-[#687789]">Unit: ms</span>
      </div>
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3DD6C6" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#3DD6C6" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1D2733" />
            <XAxis
              dataKey="timeLabel"
              stroke="#263241"
              tick={{ fontSize: 10, fill: '#687789' }}
              tickLine={false}
            />
            <YAxis
              stroke="#263241"
              tick={{ fontSize: 10, fill: '#687789' }}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="latencyMs"
              stroke="#3DD6C6"
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
