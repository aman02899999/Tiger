import type { CSSProperties, ReactNode } from "react";
import {
  useCountUp,
  useMagnetic,
  useParallax,
  useReveal,
  useScrollProgress,
  useTilt,
} from "./use3d";

/* ═══════════════════════════════════════════════════════════════════
   Tilt3DCard — pointer-reactive card with depth, glare and glow ring
   ═══════════════════════════════════════════════════════════════════ */

export function Tilt3DCard({
  children,
  className = "",
  innerClassName = "",
  max = 9,
  lift = 24,
  scale = 1.02,
  glare = true,
  ring = true,
  style,
}: {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  max?: number;
  lift?: number;
  scale?: number;
  glare?: boolean;
  ring?: boolean;
  style?: CSSProperties;
}) {
  const { ref, tiltProps } = useTilt<HTMLDivElement>({ max, lift, scale, glare });

  return (
    <div className={`scene-3d ${className}`} style={style}>
      <div
        ref={ref}
        {...tiltProps}
        className={`tilt-3d relative h-full rounded-[inherit] ${ring ? "glow-ring" : ""} ${innerClassName}`}
      >
        {children}
        {glare && <span className="tilt-glare" aria-hidden />}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MagneticButton — CTA that leans toward the cursor
   ═══════════════════════════════════════════════════════════════════ */

export function MagneticButton({
  children,
  href,
  className = "",
  strength = 0.3,
  onClick,
}: {
  children: ReactNode;
  href?: string;
  className?: string;
  strength?: number;
  onClick?: () => void;
}) {
  const ref = useMagnetic<HTMLAnchorElement>(strength);
  const cls = `magnetic btn-gloss ${className}`;

  if (href) {
    return (
      <a ref={ref} href={href} className={cls} onClick={onClick}>
        {children}
      </a>
    );
  }
  return (
    <a ref={ref} role="button" tabIndex={0} className={cls} onClick={onClick}>
      {children}
    </a>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Reveal — scroll-triggered entrance (CSS-driven, no JS per frame)
   ═══════════════════════════════════════════════════════════════════ */

export function Reveal({
  children,
  className = "",
  delay = 0,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "li" | "article";
}) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <Tag
      ref={ref as never}
      className={`reveal ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Parallax — depth-shifted decorative layer
   ═══════════════════════════════════════════════════════════════════ */

export function Parallax({
  children,
  depth = 40,
  className = "",
}: {
  children: ReactNode;
  depth?: number;
  className?: string;
}) {
  const ref = useParallax<HTMLDivElement>(depth);
  return (
    <div ref={ref} className={className} style={{ willChange: "transform" }}>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ScrollProgressBar — fixed aurora beam showing read position
   ═══════════════════════════════════════════════════════════════════ */

export function ScrollProgressBar() {
  const progress = useScrollProgress();
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-[3px] bg-transparent"
      aria-hidden
    >
      <div
        className="h-full origin-left bg-gradient-to-r from-teal-300 via-sky-400 to-amber-300"
        style={{
          transform: `scaleX(${progress})`,
          boxShadow: "0 0 18px rgba(45,212,191,0.75)",
          transition: "transform 90ms linear",
        }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CountUp — animated statistic
   ═══════════════════════════════════════════════════════════════════ */

export function CountUp({
  value,
  suffix = "",
  prefix = "",
  decimals = 0,
  className = "",
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  className?: string;
}) {
  const { ref, value: current } = useCountUp(value);
  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {prefix}
      {current.toFixed(decimals)}
      {suffix}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   AuroraBackdrop — animated mesh + grid + grain for section backgrounds
   ═══════════════════════════════════════════════════════════════════ */

export function AuroraBackdrop({ variant = "soft" }: { variant?: "soft" | "strong" }) {
  const strong = variant === "strong";
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* Aurora curtains */}
      <div
        className="absolute -left-[20%] top-[-10%] h-[60vh] w-[70vw] rounded-full blur-[110px]"
        style={{
          background: "radial-gradient(circle, rgba(94,234,212,0.22), transparent 68%)",
          animation: "auroraSweep 16s ease-in-out infinite",
          opacity: strong ? 1 : 0.6,
        }}
      />
      <div
        className="absolute -right-[15%] top-[10%] h-[55vh] w-[60vw] rounded-full blur-[120px]"
        style={{
          background: "radial-gradient(circle, rgba(59,157,255,0.20), transparent 68%)",
          animation: "auroraSweep 21s ease-in-out infinite reverse",
          opacity: strong ? 1 : 0.55,
        }}
      />
      <div
        className="absolute bottom-[-20%] left-[25%] h-[50vh] w-[50vw] rounded-full blur-[130px]"
        style={{
          background: "radial-gradient(circle, rgba(255,182,39,0.12), transparent 70%)",
          animation: "floatGlow 18s ease-in-out infinite",
          opacity: strong ? 1 : 0.5,
        }}
      />
      {/* Perspective floor grid — reads as a 3D horizon */}
      <div
        className="absolute inset-x-0 bottom-0 h-[42vh] opacity-[0.16]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(94,234,212,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(94,234,212,0.5) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          transform: "perspective(420px) rotateX(64deg)",
          transformOrigin: "bottom center",
          maskImage: "linear-gradient(to top, #000 0%, transparent 92%)",
          WebkitMaskImage: "linear-gradient(to top, #000 0%, transparent 92%)",
        }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   FloatingChips — levitating 3D glass pills (hero decoration)
   ═══════════════════════════════════════════════════════════════════ */

export function FloatingChips({ items }: { items: { label: string; icon: string; x: string; y: string; delay: number }[] }) {
  return (
    <div className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden>
      {items.map((chip) => (
        <div
          key={chip.label}
          className="absolute animate-levitate"
          style={{ left: chip.x, top: chip.y, animationDelay: `${chip.delay}s` }}
        >
          <div
            className="flex items-center gap-2 rounded-2xl border border-teal-300/25 bg-[#0a141f]/70 px-3.5 py-2 backdrop-blur-xl"
            style={{
              boxShadow: "0 18px 40px rgba(1,6,12,0.5), 0 0 24px rgba(94,234,212,0.14), inset 0 1px 0 rgba(255,255,255,0.08)",
              transform: "rotateY(-14deg) rotateX(6deg)",
            }}
          >
            <span className="text-base">{chip.icon}</span>
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#e9f3f5]/85">
              {chip.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Marquee — infinite scrolling trust strip
   ═══════════════════════════════════════════════════════════════════ */

export function Marquee({ items }: { items: string[] }) {
  const doubled = [...items, ...items];
  return (
    <div
      className="relative flex overflow-hidden"
      style={{
        maskImage: "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)",
        WebkitMaskImage: "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)",
      }}
    >
      <div className="animate-marquee flex shrink-0 items-center gap-10 pr-10">
        {doubled.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="flex shrink-0 items-center gap-3 text-xs font-bold uppercase tracking-[0.28em] text-[#e9f3f5]/45"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-teal-300/70" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
