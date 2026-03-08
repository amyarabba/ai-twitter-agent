import type { GrowthPoint } from '../types';

interface GrowthChartProps {
  points: GrowthPoint[];
}

export function GrowthChart({ points }: GrowthChartProps) {
  if (points.length === 0) {
    return null;
  }

  const width = 720;
  const height = 280;
  const paddingX = 34;
  const paddingTop = 24;
  const paddingBottom = 40;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingTop - paddingBottom;
  const xStep = points.length > 1 ? chartWidth / (points.length - 1) : 0;

  const followerValues = points.map((point) => point.followers);
  const impressionValues = points.map((point) => point.impressions);

  const minFollowers = Math.min(...followerValues);
  const maxFollowers = Math.max(...followerValues);
  const maxImpressions = Math.max(...impressionValues);
  const followerRange = Math.max(maxFollowers - minFollowers, 1);
  const barWidth = chartWidth / points.length / 1.9;

  const linePoints = points
    .map((point, index) => {
      const x = paddingX + xStep * index;
      const y =
        paddingTop +
        chartHeight -
        ((point.followers - minFollowers) / followerRange) * chartHeight;

      return `${x},${y}`;
    })
    .join(' ');

  const areaPoints = `${paddingX},${height - paddingBottom} ${linePoints} ${
    width - paddingX
  },${height - paddingBottom}`;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 text-sm text-slate-300 md:grid-cols-2">
        <div className="rounded-2xl border border-white/8 bg-white/4 px-4 py-3">
          <span className="text-xs uppercase tracking-[0.25em] text-slate-500">
            Followers
          </span>
          <p className="mt-2 text-xl font-semibold text-white">
            {maxFollowers.toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl border border-white/8 bg-white/4 px-4 py-3">
          <span className="text-xs uppercase tracking-[0.25em] text-slate-500">
            Weekly Impressions
          </span>
          <p className="mt-2 text-xl font-semibold text-white">
            {impressionValues.reduce((sum, value) => sum + value, 0).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-white/8 bg-slate-950/50 p-3">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-72 w-full"
          role="img"
          aria-label="Follower growth and impressions chart"
        >
          <defs>
            <linearGradient id="growth-area" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(34,211,238,0.35)" />
              <stop offset="100%" stopColor="rgba(34,211,238,0)" />
            </linearGradient>
            <linearGradient id="growth-line" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#bef264" />
            </linearGradient>
          </defs>

          {points.map((point, index) => {
            const x = paddingX + xStep * index;
            const barHeight = (point.impressions / maxImpressions) * (chartHeight - 8);

            return (
              <g key={point.label}>
                <rect
                  x={x - barWidth / 2}
                  y={height - paddingBottom - barHeight}
                  width={barWidth}
                  height={barHeight}
                  rx={10}
                  fill="rgba(148,163,184,0.18)"
                />
              </g>
            );
          })}

          <polygon points={areaPoints} fill="url(#growth-area)" />
          <polyline
            points={linePoints}
            fill="none"
            stroke="url(#growth-line)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {points.map((point, index) => {
            const x = paddingX + xStep * index;
            const y =
              paddingTop +
              chartHeight -
              ((point.followers - minFollowers) / followerRange) * chartHeight;

            return (
              <g key={`${point.label}-marker`}>
                <circle cx={x} cy={y} r="5" fill="#0f172a" stroke="#67e8f9" strokeWidth="3" />
                <text
                  x={x}
                  y={height - 10}
                  textAnchor="middle"
                  fill="rgba(148,163,184,0.8)"
                  fontSize="11"
                >
                  {point.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
