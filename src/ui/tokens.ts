/* ═══════════════════════════════════════════════════════════════════
   DESIGN TOKENS
   ───────────────────────────────────────────────────────────────────
   `src/index.css` owns the runtime custom properties; this module is the
   TypeScript mirror so charts, canvas code and tests can reason about the
   palette without reading CSS. Keep the two in step: the values below are
   asserted against `index.css` by `scripts/test-saas.mjs`, so a token that
   drifts out of the stylesheet fails the build instead of silently
   rendering the wrong colour.

   Naming is functional, not cosmetic: `vital` means "healthy / on track",
   `solar` means "attention", `ember` means "at risk". Charts should pick
   colour by meaning so a metric keeps its colour everywhere in the app.
   ═══════════════════════════════════════════════════════════════════ */

export const PALETTE = {
  /** Page background — near-black with a blue cast. */
  bg: "#04070e",
  surface: "#0a141f",
  surfaceRaised: "#0e1a27",
  border: "rgba(233, 243, 245, 0.10)",
  borderStrong: "rgba(233, 243, 245, 0.18)",
  text: "#e9f3f5",
  textMuted: "rgba(233, 243, 245, 0.62)",
  textFaint: "rgba(233, 243, 245, 0.40)",

  /** Brand + semantic accents. */
  aurora: "#5eead4", // primary action, "you are here"
  azure: "#3b9dff", // information
  solar: "#ffb627", // attention, money, warnings
  ember: "#ff5e5b", // risk, failure
  vital: "#34e08a", // healthy, verified, captured
  violet: "#a78bfa", // coaching/trainer surfaces
} as const;

export type TokenName = keyof typeof PALETTE;

/** Tone names map 1:1 onto `Chip`/`Stat` tones in the UI kit. */
export const TONES = ["neutral", "aurora", "azure", "solar", "ember", "vital", "muted"] as const;
export type ToneToken = (typeof TONES)[number];

/** Meaning-first colour helpers — used by every chart and status chip. */
export const SEMANTIC = {
  ok: PALETTE.vital,
  info: PALETTE.azure,
  attention: PALETTE.solar,
  risk: PALETTE.ember,
  coach: PALETTE.violet,
  neutral: PALETTE.textMuted,
} as const;

export const RISK_COLORS = {
  on_track: PALETTE.vital,
  watch: PALETTE.azure,
  at_risk: PALETTE.solar,
  dormant: PALETTE.ember,
} as const;

export const PAYMENT_STATUS_COLORS = {
  created: PALETTE.textMuted,
  pending: PALETTE.solar,
  captured: PALETTE.vital,
  failed: PALETTE.ember,
  refunded: PALETTE.azure,
  disputed: PALETTE.ember,
  revoked: PALETTE.ember,
} as const;

export const ENTITLEMENT_STATUS_COLORS = {
  pending: PALETTE.solar,
  active: PALETTE.vital,
  cancelled: PALETTE.textMuted,
  expired: PALETTE.textMuted,
  refunded: PALETTE.azure,
  revoked: PALETTE.ember,
} as const;

/* ── Geometry ───────────────────────────────────────────────────── */

export const RADII = { sm: 8, md: 12, lg: 16, xl: 22, pill: 999 } as const;
export const SPACE = [0, 4, 8, 12, 16, 20, 24, 32, 40, 56, 72] as const;

/** Elevation is depth-by-light, not drop-shadow soup. */
export const ELEVATION = {
  flat: "none",
  raised: "0 1px 0 rgba(255,255,255,0.04) inset, 0 18px 50px -30px rgba(0,0,0,0.9)",
  overlay: "0 50px 140px -40px rgba(0,0,0,1)",
  glow: "0 0 0 1px rgba(94,234,212,0.22), 0 24px 70px -40px rgba(94,234,212,0.55)",
} as const;

export const MOTION = {
  fast: 120,
  base: 220,
  slow: 380,
  /** Respect the user's setting: every animated component reads this. */
  respectsReducedMotion: true,
} as const;

export const TYPE = {
  display: { size: 40, weight: 900, tracking: "-0.05em" },
  title: { size: 22, weight: 800, tracking: "-0.03em" },
  body: { size: 14, weight: 500, tracking: "0" },
  label: { size: 11, weight: 700, tracking: "0.18em" },
  mono: { size: 13, weight: 600, tracking: "0" },
} as const;

/* ── Chart series order ─────────────────────────────────────────── */

/**
 * A stable series order so "volume" is always aurora and "adherence" is
 * always azure across every screen. Charts that pick colours ad hoc are
 * how dashboards stop being readable.
 */
export const SERIES = ["aurora", "azure", "solar", "violet", "vital", "ember"] as const;
export type SeriesName = (typeof SERIES)[number];

export function seriesColor(index: number): string {
  return PALETTE[SERIES[index % SERIES.length]];
}

/* ── Density ────────────────────────────────────────────────────── */

/**
 * Premium tools let people choose density. `comfortable` is for public
 * screens, `compact` is what a trainer on a phone between clients wants.
 */
export const DENSITY = {
  comfortable: { rowHeight: 56, padY: 16, padX: 20, gap: 20 },
  compact: { rowHeight: 40, padY: 10, padX: 14, gap: 12 },
} as const;

export type DensityName = keyof typeof DENSITY;

/** Values mirrored into CSS in `index.css`; kept here for the token test. */
export const CSS_SYNCED_TOKENS: Array<{ cssVar: string; value: string }> = [
  { cssVar: "--clr-bg", value: PALETTE.bg },
  { cssVar: "--clr-surface", value: PALETTE.surface },
  { cssVar: "--clr-aurora", value: PALETTE.aurora },
  { cssVar: "--clr-azure", value: PALETTE.azure },
  { cssVar: "--clr-solar", value: PALETTE.solar },
  { cssVar: "--clr-ember", value: PALETTE.ember },
  { cssVar: "--clr-vital", value: PALETTE.vital },
];
