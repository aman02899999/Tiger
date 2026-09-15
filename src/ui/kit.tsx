/* ═══════════════════════════════════════════════════════════════════
   TITAN UI KIT — the premium surface language
   ───────────────────────────────────────────────────────────────────
   Rules this kit encodes (so every screen looks like the same product):

   • Depth comes from hairline borders + inner highlights, not heavy
     shadows. One elevation step per hierarchy level, never more.
   • Numbers are `tabular-nums`, tight tracking, high contrast. Data is
     the decoration.
   • Gold is reserved for commercial/premium moments only.
   • Emoji are never chrome. Icons are geometric glyphs.
   • Every list has four states: loading (skeleton), empty (honest copy
     + one action), error (recoverable), populated.
   ═══════════════════════════════════════════════════════════════════ */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "../utils/cn";

/* ── Surfaces ───────────────────────────────────────────────────── */

export function Panel({
  children,
  className,
  padded = true,
  tone = "default",
  as: Tag = "section",
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
  tone?: "default" | "raised" | "gold" | "danger";
  as?: "section" | "div" | "article" | "aside";
}) {
  const tones = {
    default: "border-white/[0.07] bg-white/[0.022]",
    raised: "border-white/[0.09] bg-white/[0.04]",
    gold: "border-amber-300/25 bg-amber-300/[0.05]",
    danger: "border-rose-400/25 bg-rose-500/[0.06]",
  } as const;
  return (
    <Tag
      className={cn(
        "relative rounded-2xl border shadow-[0_1px_0_rgba(255,255,255,0.05)_inset,0_18px_48px_-24px_rgba(0,0,0,0.9)]",
        tones[tone],
        padded && "p-5 sm:p-6",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.28em] text-violet-200/70">{eyebrow}</p>
        )}
        <h1 className="text-2xl font-black tracking-[-0.03em] text-[#e9f3f5] sm:text-[28px]">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[#e9f3f5]/55">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function SectionTitle({
  title,
  subtitle,
  actions,
  className,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-3", className)}>
      <div className="min-w-0">
        <h2 className="text-[17px] font-black tracking-[-0.02em] text-[#e9f3f5]">{title}</h2>
        {subtitle && <p className="mt-1 max-w-2xl text-xs leading-5 text-[#e9f3f5]/50">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Divider({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent", className)} />;
}

/* ── Actions ────────────────────────────────────────────────────── */

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost" | "danger" | "gold";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: ReactNode;
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  className,
  disabled,
  ...rest
}: ButtonProps) {
  const variants = {
    primary:
      "text-[#03181d] bg-gradient-to-r from-violet-200 via-violet-300 to-fuchsia-300 hover:brightness-110 shadow-[0_10px_30px_-12px_rgba(94,234,212,0.7)]",
    gold: "text-[#2a1a02] bg-gradient-to-r from-amber-200 via-amber-300 to-amber-500 hover:brightness-110 shadow-[0_10px_30px_-12px_rgba(255,182,39,0.8)]",
    outline: "border border-white/12 bg-white/[0.03] text-[#e9f3f5] hover:border-white/20 hover:bg-white/[0.07]",
    ghost: "text-[#e9f3f5]/70 hover:bg-white/[0.06] hover:text-[#e9f3f5]",
    danger: "border border-rose-400/30 bg-rose-500/15 text-rose-100 hover:bg-rose-500/25",
  } as const;
  const sizes = {
    sm: "h-8 px-3 text-[11px]",
    md: "h-10 px-4 text-xs",
    lg: "h-12 px-6 text-sm",
  } as const;
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-bold uppercase tracking-[0.14em] transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/50",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {loading ? <Spinner /> : icon}
      {children}
    </button>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/25 border-t-current", className)}
    />
  );
}

export function IconButton({
  children,
  label,
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      {...rest}
      aria-label={label}
      title={label}
      className={cn(
        "grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-[#e9f3f5]/70 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-[#e9f3f5]",
        className,
      )}
    >
      {children}
    </button>
  );
}

/* ── Chips & badges ─────────────────────────────────────────────── */

export type Tone = "neutral" | "aurora" | "azure" | "solar" | "ember" | "vital" | "muted";

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "border-white/12 bg-white/[0.06] text-[#e9f3f5]/80",
  aurora: "border-violet-300/30 bg-violet-300/12 text-violet-100",
  azure: "border-fuchsia-300/30 bg-fuchsia-400/12 text-fuchsia-100",
  solar: "border-amber-300/30 bg-amber-400/12 text-amber-100",
  ember: "border-rose-400/30 bg-rose-500/14 text-rose-100",
  vital: "border-emerald-300/30 bg-emerald-400/12 text-emerald-100",
  muted: "border-white/8 bg-white/[0.03] text-[#e9f3f5]/50",
};

export function Chip({
  children,
  tone = "neutral",
  className,
  dot = false,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
  dot?: boolean;
}) {
  const dotColor: Record<Tone, string> = {
    neutral: "bg-white/60",
    aurora: "bg-violet-300",
    azure: "bg-fuchsia-300",
    solar: "bg-amber-300",
    ember: "bg-rose-400",
    vital: "bg-emerald-300",
    muted: "bg-white/30",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em]",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", dotColor[tone])} />}
      {children}
    </span>
  );
}

export function RiskChip({ level, className }: { level: "on_track" | "watch" | "at_risk" | "dormant"; className?: string }) {
  const map = {
    on_track: { tone: "vital" as Tone, label: "On track" },
    watch: { tone: "solar" as Tone, label: "Watch" },
    at_risk: { tone: "ember" as Tone, label: "At risk" },
    dormant: { tone: "muted" as Tone, label: "Dormant" },
  }[level];
  return (
    <Chip tone={map.tone} dot className={className}>
      {map.label}
    </Chip>
  );
}

/* ── Metrics ────────────────────────────────────────────────────── */

export function Stat({
  label,
  value,
  unit,
  hint,
  delta,
  tone = "default",
  chart,
  className,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  hint?: string;
  delta?: { value: string; direction: "up" | "down" | "flat"; good?: boolean };
  tone?: "default" | "gold";
  chart?: ReactNode;
  className?: string;
}) {
  const deltaTone =
    delta?.direction === "flat"
      ? "text-[#e9f3f5]/50"
      : (delta?.good ?? delta?.direction === "up")
        ? "text-emerald-300"
        : "text-rose-300";
  return (
    <Panel className={cn("flex flex-col justify-between gap-3", tone === "gold" && "border-amber-300/25", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#e9f3f5]/45">{label}</p>
        {delta && (
          <span className={cn("text-[11px] font-bold tabular-nums", deltaTone)}>
            {delta.direction === "up" ? "▲" : delta.direction === "down" ? "▼" : "◆"} {delta.value}
          </span>
        )}
      </div>
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-[26px] font-black leading-none tracking-[-0.04em] tabular-nums text-[#e9f3f5]">
            {value}
            {unit && <span className="ml-1 text-sm font-bold text-[#e9f3f5]/45">{unit}</span>}
          </p>
          {hint && <p className="mt-1.5 text-[11px] text-[#e9f3f5]/45">{hint}</p>}
        </div>
        {chart && <div className="shrink-0">{chart}</div>}
      </div>
    </Panel>
  );
}

export function MetricGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-4", className)}>{children}</div>;
}

/* ── Avatars ────────────────────────────────────────────────────── */

const AVATAR_GRADIENTS = [
  "from-violet-300 to-fuchsia-400",
  "from-fuchsia-300 to-violet-500",
  "from-amber-200 to-rose-400",
  "from-emerald-300 to-violet-400",
  "from-sky-300 to-violet-500",
  "from-rose-300 to-amber-400",
];

export function Avatar({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  const initials = useMemo(
    () =>
      name
        .split(" ")
        .map((part) => part.trim()[0])
        .filter(Boolean)
        .join("")
        .slice(0, 2)
        .toUpperCase() || "TF",
    [name],
  );
  const hash = useMemo(() => [...name].reduce((acc, char) => acc + char.charCodeAt(0), 0), [name]);
  const sizes = {
    xs: "h-7 w-7 text-[10px]",
    sm: "h-9 w-9 text-[11px]",
    md: "h-11 w-11 text-sm",
    lg: "h-16 w-16 text-lg",
  } as const;
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-gradient-to-br font-black text-[#04121a]",
        AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length],
        sizes[size],
        className,
      )}
    >
      {initials}
    </span>
  );
}

/* ── States ─────────────────────────────────────────────────────── */

export function EmptyState({
  title,
  body,
  action,
  icon = "◇",
  className,
}: {
  title: string;
  body: string;
  action?: ReactNode;
  icon?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.015] px-6 py-12 text-center", className)}>
      <span className="mb-4 grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.03] text-lg text-violet-200/80">
        {icon}
      </span>
      <p className="text-base font-bold tracking-[-0.01em] text-[#e9f3f5]">{title}</p>
      <p className="mt-2 max-w-md text-sm leading-6 text-[#e9f3f5]/50">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-white/[0.05]", className)} />;
}

export function LoadingRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-16 w-full" />
      ))}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Panel tone="danger" className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="text-sm font-bold text-rose-100">Could not load this data</p>
        <p className="mt-1 text-xs text-rose-100/70">{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </Panel>
  );
}

/** The honest zero state required by the analytics contract. */
export function NoData({ what, className }: { what: string; className?: string }) {
  return (
    <p className={cn("text-xs font-semibold uppercase tracking-[0.18em] text-[#e9f3f5]/35", className)}>
      No data yet — {what}
    </p>
  );
}

/* ── Progress ───────────────────────────────────────────────────── */

export function ProgressBar({
  value,
  max = 100,
  tone = "aurora",
  className,
}: {
  value: number;
  max?: number;
  tone?: Tone;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const fills: Record<string, string> = {
    aurora: "bg-gradient-to-r from-violet-300 to-fuchsia-300",
    solar: "bg-gradient-to-r from-amber-200 to-amber-400",
    ember: "bg-gradient-to-r from-rose-300 to-rose-500",
    vital: "bg-gradient-to-r from-emerald-300 to-emerald-500",
    azure: "bg-gradient-to-r from-fuchsia-300 to-violet-400",
    neutral: "bg-white/50",
    muted: "bg-white/25",
  };
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]", className)}>
      <div
        className={cn("h-full rounded-full transition-[width] duration-700", fills[tone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function Ring({
  value,
  size = 72,
  stroke = 6,
  label,
  sub,
  tone = "#5eead4",
}: {
  value: number | null;
  size?: number;
  stroke?: number;
  label?: string;
  sub?: string;
  tone?: string;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = value === null ? 0 : Math.max(0, Math.min(100, value));
  const dash = (clamped / 100) * circumference;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={tone}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          style={{ transition: "stroke-dasharray 700ms cubic-bezier(0.16,1,0.3,1)" }}
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-sm font-black tabular-nums text-[#e9f3f5]">{value === null ? "—" : `${Math.round(clamped)}%`}</p>
        {label && <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#e9f3f5]/45">{label}</p>}
        {sub && <p className="text-[9px] text-[#e9f3f5]/35">{sub}</p>}
      </div>
    </div>
  );
}

/* ── Controls ───────────────────────────────────────────────────── */

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1", className)}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-full px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] transition",
            value === option.value ? "bg-white/[0.12] text-[#e9f3f5]" : "text-[#e9f3f5]/50 hover:text-[#e9f3f5]/80",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: Array<{ value: T; label: string; badge?: ReactNode }>;
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-1 overflow-x-auto border-b border-white/[0.07]", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={cn(
            "relative shrink-0 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.14em] transition",
            value === tab.value ? "text-[#e9f3f5]" : "text-[#e9f3f5]/45 hover:text-[#e9f3f5]/75",
          )}
        >
          <span className="flex items-center gap-2">
            {tab.label}
            {tab.badge}
          </span>
          {value === tab.value && (
            <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-violet-300 to-fuchsia-400" />
          )}
        </button>
      ))}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#e9f3f5]/50">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-[11px] text-[#e9f3f5]/40">{hint}</span>}
    </label>
  );
}

const inputBase =
  "w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-[#e9f3f5] outline-none transition placeholder:text-[#e9f3f5]/25 focus:border-violet-300/40 focus:bg-white/[0.06]";

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...rest} className={cn(inputBase, className)} />;
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...rest} className={cn(inputBase, "min-h-[88px] resize-y", className)} />;
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...rest} className={cn(inputBase, "appearance-none bg-[#0a141f] pr-9", className)}>
      {children}
    </select>
  );
}

/* ── Data table ─────────────────────────────────────────────────── */

export type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
};

export function DataTable<T>({
  rows,
  columns,
  onRowClick,
  empty,
  dense = false,
  className,
}: {
  rows: T[];
  columns: Array<Column<T>>;
  onRowClick?: (row: T) => void;
  empty?: ReactNode;
  dense?: boolean;
  className?: string;
}) {
  if (rows.length === 0 && empty) return <>{empty}</>;
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full min-w-[640px] border-collapse text-left">
        <thead>
          <tr className="border-b border-white/[0.07]">
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  "px-3 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#e9f3f5]/40",
                  column.align === "right" && "text-right",
                  column.align === "center" && "text-center",
                  column.className,
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={index}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                "border-b border-white/[0.04] transition",
                onRowClick && "cursor-pointer hover:bg-white/[0.035]",
              )}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn(
                    "px-3 text-sm text-[#e9f3f5]/85",
                    dense ? "py-2" : "py-3.5",
                    column.align === "right" && "text-right",
                    column.align === "center" && "text-center",
                    column.className,
                  )}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Overlays ───────────────────────────────────────────────────── */

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = "lg",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: "sm" | "md" | "lg" | "xl";
}) {
  const titleId = useId();
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  const widths = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl", xl: "max-w-5xl" } as const;
  return (
    <div className="fixed inset-0 z-[300] flex items-start justify-center overflow-y-auto bg-[#04070e]/85 p-4 backdrop-blur-sm sm:p-8">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "relative w-full rounded-[24px] border border-white/10 bg-[#0a141f] p-6 shadow-[0_60px_160px_-40px_rgba(0,0,0,1)]",
          widths[width],
        )}
      >
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 id={titleId} className="text-xl font-black tracking-[-0.03em] text-[#e9f3f5]">
              {title}
            </h2>
            {description && <p className="mt-1.5 text-sm text-[#e9f3f5]/50">{description}</p>}
          </div>
          <IconButton label="Close" onClick={onClose}>
            ✕
          </IconButton>
        </div>
        <div className="mt-6">{children}</div>
        {footer && <div className="mt-7 flex flex-wrap justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[280] flex justify-end bg-[#04070e]/70 backdrop-blur-sm">
      <button type="button" aria-label="Close panel" className="flex-1 cursor-default" onClick={onClose} />
      <aside className="flex h-full w-full max-w-2xl flex-col border-l border-white/10 bg-[#070d17] shadow-[-40px_0_120px_-40px_rgba(0,0,0,1)]">
        <header className="flex items-start justify-between gap-4 border-b border-white/[0.07] p-5">
          <div>
            <div className="text-lg font-black tracking-[-0.02em] text-[#e9f3f5]">{title}</div>
            {subtitle && <div className="mt-1 text-xs text-[#e9f3f5]/50">{subtitle}</div>}
          </div>
          <IconButton label="Close" onClick={onClose}>
            ✕
          </IconButton>
        </header>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <footer className="border-t border-white/[0.07] p-5">{footer}</footer>}
      </aside>
    </div>
  );
}

/* ── Toasts ─────────────────────────────────────────────────────── */

export type ToastKind = "success" | "error" | "info";
type ToastItem = { id: number; kind: ToastKind; message: string };

const ToastContext = createContext<{ push: (message: string, kind?: ToastKind) => void }>({ push: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const push = useCallback((message: string, kind: ToastKind = "info") => {
    const id = Date.now() + Math.random();
    setItems((current) => [...current, { id, kind, message }]);
    window.setTimeout(() => setItems((current) => current.filter((item) => item.id !== id)), 4200);
  }, []);
  const value = useMemo(() => ({ push }), [push]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[400] flex w-[min(360px,90vw)] flex-col gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "pointer-events-auto rounded-2xl border px-4 py-3 text-sm font-semibold shadow-[0_24px_60px_-24px_rgba(0,0,0,0.95)]",
              item.kind === "success" && "border-emerald-300/30 bg-[#08201a] text-emerald-100",
              item.kind === "error" && "border-rose-400/30 bg-[#220c10] text-rose-100",
              item.kind === "info" && "border-white/12 bg-[#0a141f] text-[#e9f3f5]",
            )}
          >
            {item.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
