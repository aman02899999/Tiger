/* ═══════════════════════════════════════════════════════════════════
   CHARTS — dependency-free SVG, sized for dashboards
   ───────────────────────────────────────────────────────────────────
   Deliberately small: a dashboard that needs a charting library to
   render a 40-point sparkline pays 90 kB for it. These primitives are
   exact, themeable, and render nothing (not a zero-line) when there is
   no data — the caller shows "No data yet" instead.
   ═══════════════════════════════════════════════════════════════════ */

import { useId, useMemo } from "react";
import { cn } from "../utils/cn";

type Point = { x: number; y: number };

function toPath(points: Point[], width: number, height: number, pad = 4): string {
  if (points.length === 0) return "";
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;
  return points
    .map((point, index) => {
      const px = pad + ((point.x - minX) / spanX) * (width - pad * 2);
      const py = height - pad - ((point.y - minY) / spanY) * (height - pad * 2);
      return `${index === 0 ? "M" : "L"}${px.toFixed(2)},${py.toFixed(2)}`;
    })
    .join(" ");
}

export function Sparkline({
  values,
  width = 96,
  height = 28,
  tone = "#5eead4",
  className,
  filled = true,
}: {
  values: number[];
  width?: number;
  height?: number;
  tone?: string;
  className?: string;
  filled?: boolean;
}) {
  const gradientId = useId();
  const series = values.filter((value) => Number.isFinite(value));
  const path = useMemo(
    () => toPath(series.map((y, x) => ({ x, y })), width, height),
    [series, width, height],
  );
  if (series.length < 2) return null;
  return (
    <svg width={width} height={height} className={className} aria-hidden>
      {filled && (
        <>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={tone} stopOpacity="0.35" />
              <stop offset="100%" stopColor={tone} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${path} L${width - 4},${height} L4,${height} Z`} fill={`url(#${gradientId})`} stroke="none" />
        </>
      )}
      <path d={path} fill="none" stroke={tone} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TrendChart({
  points,
  height = 180,
  tone = "#5eead4",
  secondary,
  labels,
  className,
}: {
  points: number[];
  height?: number;
  tone?: string;
  secondary?: number[];
  labels?: string[];
  className?: string;
}) {
  const width = 640;
  const gradientId = useId();
  if (points.length < 2) return null;
  const path = toPath(points.map((y, x) => ({ x, y })), width, height, 8);
  const secondaryPath = secondary && secondary.length > 1
    ? toPath(secondary.map((y, x) => ({ x, y })), width, height, 8)
    : null;
  return (
    <div className={cn("w-full", className)}>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={tone} stopOpacity="0.28" />
            <stop offset="100%" stopColor={tone} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((ratio) => (
          <line
            key={ratio}
            x1="0"
            x2={width}
            y1={height * ratio}
            y2={height * ratio}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
          />
        ))}
        <path d={`${path} L${width - 8},${height} L8,${height} Z`} fill={`url(#${gradientId})`} />
        <path d={path} fill="none" stroke={tone} strokeWidth="2" strokeLinecap="round" />
        {secondaryPath && (
          <path d={secondaryPath} fill="none" stroke="#3b9dff" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.7" />
        )}
      </svg>
      {labels && (
        <div className="mt-2 flex justify-between text-[10px] font-semibold uppercase tracking-[0.14em] text-[#e9f3f5]/35">
          {labels.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export function BarSeries({
  bars,
  height = 140,
  tone = "#5eead4",
  className,
  valueFormatter,
}: {
  bars: Array<{ label: string; value: number }>;
  height?: number;
  tone?: string;
  className?: string;
  valueFormatter?: (value: number) => string;
}) {
  const max = Math.max(...bars.map((bar) => bar.value), 1);
  if (bars.length === 0) return null;
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-end gap-1.5" style={{ height }}>
        {bars.map((bar, index) => {
          const pct = (bar.value / max) * 100;
          const isLast = index === bars.length - 1;
          return (
            <div key={`${bar.label}-${index}`} className="group relative flex flex-1 flex-col items-center justify-end">
              <span className="pointer-events-none absolute -top-6 hidden rounded-lg border border-white/10 bg-[#0a141f] px-2 py-1 text-[10px] font-bold tabular-nums text-[#e9f3f5] group-hover:block">
                {valueFormatter ? valueFormatter(bar.value) : bar.value}
              </span>
              <div
                className="w-full rounded-t-md transition-all duration-500"
                style={{
                  height: `${Math.max(pct, 2)}%`,
                  background: isLast
                    ? `linear-gradient(180deg, ${tone}, ${tone}55)`
                    : "linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0.06))",
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-1.5">
        {bars.map((bar, index) => (
          <span
            key={`${bar.label}-label-${index}`}
            className="flex-1 truncate text-center text-[9px] font-semibold uppercase tracking-[0.1em] text-[#e9f3f5]/35"
          >
            {bar.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Adherence heat strip: one cell per day, reusing the risk colour scale. */
export function HeatStrip({
  days,
  className,
}: {
  days: Array<{ date: string; intensity: number }>;
  className?: string;
}) {
  if (days.length === 0) return null;
  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {days.map((day) => {
        const level = Math.max(0, Math.min(1, day.intensity));
        const background =
          level === 0
            ? "rgba(255,255,255,0.05)"
            : `rgba(94, 234, 212, ${0.18 + level * 0.62})`;
        return (
          <span
            key={day.date}
            title={`${day.date}`}
            className="h-4 w-4 rounded-[5px] border border-white/[0.06]"
            style={{ background }}
          />
        );
      })}
    </div>
  );
}

export function Legend({ items }: { items: Array<{ label: string; color: string }> }) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#e9f3f5]/45">
          <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  );
}
