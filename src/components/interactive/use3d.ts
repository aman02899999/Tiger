import { useCallback, useEffect, useRef, useState } from "react";

/** Respect the OS "reduce motion" setting for every effect in this module. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return reduced;
}

/** Coarse pointers (touch) get no hover-tilt — it would fight with scrolling. */
export function useFinePointer(): boolean {
  const [fine, setFine] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    const apply = () => setFine(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return fine;
}

type TiltOptions = {
  /** Max rotation in degrees on each axis. */
  max?: number;
  /** Z-translation applied while hovered, in px. */
  lift?: number;
  /** Scale applied while hovered. */
  scale?: number;
  /** Render the specular glare sheet (requires a .tilt-glare child). */
  glare?: boolean;
};

/**
 * Pointer-reactive 3D tilt.
 *
 * Writes CSS custom properties directly on the node (never React state) so
 * the pointermove handler stays off the React render path — this keeps a
 * grid of 30+ tilting cards at a solid 60fps.
 */
export function useTilt<T extends HTMLElement = HTMLDivElement>(options: TiltOptions = {}) {
  const { max = 10, lift = 22, scale = 1.02, glare = true } = options;
  const ref = useRef<T>(null);
  const frame = useRef(0);
  const reduced = usePrefersReducedMotion();
  const fine = useFinePointer();
  const enabled = !reduced && fine;

  const onPointerMove = useCallback(
    (e: React.PointerEvent<T>) => {
      const el = ref.current;
      if (!el || !enabled) return;
      cancelAnimationFrame(frame.current);
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      frame.current = requestAnimationFrame(() => {
        // py above centre -> tilt top toward viewer
        el.style.setProperty("--rx", `${(0.5 - py) * max * 2}deg`);
        el.style.setProperty("--ry", `${(px - 0.5) * max * 2}deg`);
        if (glare) {
          el.style.setProperty("--gx", `${px * 100}%`);
          el.style.setProperty("--gy", `${py * 100}%`);
        }
      });
    },
    [enabled, max, glare]
  );

  const onPointerEnter = useCallback(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    el.dataset.active = "true";
    el.style.setProperty("--tz", `${lift}px`);
    el.style.setProperty("--ts", `${scale}`);
  }, [enabled, lift, scale]);

  const onPointerLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    cancelAnimationFrame(frame.current);
    el.dataset.active = "false";
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--tz", "0px");
    el.style.setProperty("--ts", "1");
  }, []);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  return {
    ref,
    tiltProps: enabled ? { onPointerMove, onPointerEnter, onPointerLeave } : {},
    enabled,
  };
}

/**
 * Magnetic pull — the element drifts toward the cursor as it approaches.
 * Great for primary CTAs: it makes the button feel "eager".
 */
export function useMagnetic<T extends HTMLElement = HTMLAnchorElement>(strength = 0.32, radius = 90) {
  const ref = useRef<T>(null);
  const frame = useRef(0);
  const reduced = usePrefersReducedMotion();
  const fine = useFinePointer();
  const enabled = !reduced && fine;

  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;

    function onMove(e: PointerEvent) {
      const node = ref.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      const reach = Math.max(rect.width, rect.height) / 2 + radius;

      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        if (dist < reach) {
          const falloff = 1 - dist / reach;
          node.dataset.active = "true";
          node.style.setProperty("--mx", `${dx * strength * falloff}px`);
          node.style.setProperty("--my", `${dy * strength * falloff}px`);
        } else if (node.dataset.active === "true") {
          node.dataset.active = "false";
          node.style.setProperty("--mx", "0px");
          node.style.setProperty("--my", "0px");
        }
      });
    }

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame.current);
    };
  }, [enabled, strength, radius]);

  return ref;
}

/**
 * Scroll-linked parallax depth. Returns a ref; the node is translated on Y
 * proportionally to how far it has travelled through the viewport.
 */
export function useParallax<T extends HTMLElement = HTMLDivElement>(depth = 40) {
  const ref = useRef<T>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    let ticking = false;

    function update() {
      const node = ref.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // -1 (just below viewport) .. 1 (just above)
      const progress = (rect.top + rect.height / 2 - vh / 2) / vh;
      node.style.transform = `translate3d(0, ${(-progress * depth).toFixed(2)}px, 0)`;
      ticking = false;
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [depth, reduced]);

  return ref;
}

/** Adds `.is-visible` once the node scrolls into view (one-shot). */
export function useReveal<T extends HTMLElement = HTMLDivElement>(threshold = 0.15) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      el.classList.add("is-visible");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return ref;
}

/** Normalised page scroll progress, 0 -> 1. */
export function useScrollProgress(): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let ticking = false;
    function update() {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      setProgress(max > 0 ? Math.min(1, doc.scrollTop / max) : 0);
      ticking = false;
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return progress;
}

/** Counts up to `target` when the element first enters the viewport. */
export function useCountUp(target: number, duration = 1600) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced) {
      setValue(target);
      return;
    }
    let raf = 0;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          // easeOutExpo
          const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
          setValue(target * eased);
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [target, duration, reduced]);

  return { ref, value };
}
