import { useCallback, useEffect, useRef } from 'react';

interface SpringConfig {
  stiffness?: number;
  damping?: number;
  mass?: number;
  maxStretch?: number;
  verticalLift?: number;
}

interface ItemGeometry {
  x: number;
  w: number;
}

/**
 * Real rAF mass-spring-damper solver for sliding liquid-glass thumbs/droplets.
 * Pre-caches button geometry on mount & ResizeObserver (zero layout reads in rAF).
 * Drives compositor-only transform + width on an isolated thumb element, plus
 * an optional GPU-composited trailing cast shadow element.
 */
export function useSegmentedSpring(
  containerRef: React.RefObject<HTMLElement | null>,
  itemRefs: React.MutableRefObject<(HTMLElement | null)[]>,
  targetIndex: number | null,
  itemCount: number,
  config: SpringConfig = {}
) {
  const {
    stiffness = 380,
    damping = 28,
    mass = 0.85,
    maxStretch = 0.14,
    verticalLift = 1.6,
  } = config;

  const thumbRef = useRef<HTMLSpanElement | null>(null);
  const shadowRef = useRef<HTMLSpanElement | null>(null);

  const geometriesRef = useRef<ItemGeometry[]>([]);
  const targetIdxRef = useRef<number | null>(targetIndex);
  const initializedRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const stateRef = useRef({
    x: 0,
    vx: 0,
    w: 80,
    vw: 0,
    opacity: 0,
    vOpacity: 0,
  });

  const measureItems = useCallback(() => {
    const next: ItemGeometry[] = [];
    for (let i = 0; i < itemCount; i++) {
      const el = itemRefs.current[i];
      if (el) {
        next.push({ x: el.offsetLeft, w: el.offsetWidth });
      } else {
        next.push({ x: 0, w: 72 });
      }
    }
    geometriesRef.current = next;
  }, [itemCount, itemRefs]);

  const applyDOM = useCallback(
    (x: number, w: number, vx: number, opacity: number) => {
      const thumb = thumbRef.current;
      const shadow = shadowRef.current;

      const speed = Math.abs(vx);
      const stretchX = 1 + Math.min(maxStretch, speed * 0.00038);
      const squishY = 1 / Math.sqrt(stretchX);
      const liftY = -Math.min(verticalLift, speed * 0.0045);

      if (thumb) {
        thumb.style.width = `${Math.max(24, w).toFixed(2)}px`;
        thumb.style.opacity = opacity.toFixed(3);
        thumb.style.transform = `translate3d(${x.toFixed(2)}px, ${liftY.toFixed(2)}px, 0) scale(${stretchX.toFixed(4)}, ${squishY.toFixed(4)})`;
      }

      if (shadow) {
        const shadowLagX = x - Math.max(-10, Math.min(10, vx * 0.014));
        const shadowDropY = 3 + Math.min(4, speed * 0.008);
        shadow.style.width = `${Math.max(24, w).toFixed(2)}px`;
        shadow.style.opacity = (opacity * 0.85).toFixed(3);
        shadow.style.transform = `translate3d(${shadowLagX.toFixed(2)}px, ${shadowDropY.toFixed(2)}px, 0) scale(${(stretchX * 0.98).toFixed(4)}, ${(squishY * 0.92).toFixed(4)})`;
      }
    },
    [maxStretch, verticalLift]
  );

  const step = useCallback(
    (now: number) => {
      const dtRaw = lastTimeRef.current ? (now - lastTimeRef.current) / 1000 : 1 / 60;
      lastTimeRef.current = now;
      const dt = Math.min(0.032, Math.max(0.004, dtRaw));

      const idx = targetIdxRef.current;
      const geom = idx !== null ? geometriesRef.current[idx] : undefined;
      const s = stateRef.current;

      const targetX = geom ? geom.x : s.x;
      const targetW = geom ? geom.w : s.w;
      const targetOp = geom ? 1 : 0;

      // Semi-implicit Euler integration of mass-spring-damper
      const fx = -stiffness * (s.x - targetX) - damping * s.vx;
      const fw = -stiffness * (s.w - targetW) - damping * s.vw;
      const fo = -240 * (s.opacity - targetOp) - 24 * s.vOpacity;

      s.vx += (fx / mass) * dt;
      s.vw += (fw / mass) * dt;
      s.vOpacity += (fo / mass) * dt;

      s.x += s.vx * dt;
      s.w += s.vw * dt;
      s.opacity = Math.max(0, Math.min(1, s.opacity + s.vOpacity * dt));

      applyDOM(s.x, s.w, s.vx, s.opacity);

      const settled =
        Math.abs(targetX - s.x) < 0.08 &&
        Math.abs(s.vx) < 0.15 &&
        Math.abs(targetW - s.w) < 0.08 &&
        Math.abs(s.vw) < 0.15 &&
        Math.abs(targetOp - s.opacity) < 0.01 &&
        Math.abs(s.vOpacity) < 0.02;

      if (settled) {
        s.x = targetX;
        s.w = targetW;
        s.opacity = targetOp;
        s.vx = 0;
        s.vw = 0;
        s.vOpacity = 0;
        applyDOM(s.x, s.w, 0, s.opacity);
        rafRef.current = null;
        lastTimeRef.current = 0;
        return;
      }

      rafRef.current = requestAnimationFrame(step);
    },
    [applyDOM, damping, mass, stiffness]
  );

  const wake = useCallback(() => {
    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const idx = targetIdxRef.current;
    const geom = idx !== null ? geometriesRef.current[idx] : undefined;

    if (reduceMotion) {
      if (geom) {
        stateRef.current.x = geom.x;
        stateRef.current.w = geom.w;
        stateRef.current.opacity = 1;
        applyDOM(geom.x, geom.w, 0, 1);
      } else {
        stateRef.current.opacity = 0;
        applyDOM(stateRef.current.x, stateRef.current.w, 0, 0);
      }
      return;
    }

    if (!initializedRef.current && geom) {
      initializedRef.current = true;
      stateRef.current.x = geom.x;
      stateRef.current.w = geom.w;
      stateRef.current.opacity = 1;
      applyDOM(geom.x, geom.w, 0, 1);
      return;
    }

    if (rafRef.current === null) {
      lastTimeRef.current = 0;
      rafRef.current = requestAnimationFrame(step);
    }
  }, [applyDOM, step]);

  useEffect(() => {
    targetIdxRef.current = targetIndex;
    measureItems();
    wake();
  }, [targetIndex, itemCount, measureItems, wake]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;

    const ro = new ResizeObserver(() => {
      measureItems();
      const idx = targetIdxRef.current;
      const geom = idx !== null ? geometriesRef.current[idx] : undefined;
      if (geom && rafRef.current === null) {
        stateRef.current.x = geom.x;
        stateRef.current.w = geom.w;
        applyDOM(geom.x, geom.w, 0, stateRef.current.opacity);
      }
    });
    ro.observe(el);

    let cancelled = false;
    if (document.fonts && document.fonts.ready) {
      void document.fonts.ready.then(() => {
        if (cancelled) return;
        measureItems();
        wake();
      });
    }

    return () => {
      cancelled = true;
      ro.disconnect();
    };
  }, [applyDOM, containerRef, measureItems, wake]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return { thumbRef, shadowRef, remeasure: measureItems };
}

/**
 * Compositor-only magnetic pointer pull hook.
 * Caches element bounds on pointerenter (zero sync layout reads in pointermove).
 */
export function useMagneticPull<T extends HTMLElement>(
  strength = 0.24,
  hoverScale = 1.028
) {
  const ref = useRef<T | null>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const targetRef = useRef({ x: 0, y: 0, s: 1 });
  const currentRef = useRef({ x: 0, y: 0, s: 1, vx: 0, vy: 0, vs: 0 });
  const rafRef = useRef<number | null>(null);

  const tick = useCallback(() => {
    const el = ref.current;
    if (!el) {
      rafRef.current = null;
      return;
    }

    const c = currentRef.current;
    const t = targetRef.current;
    const stiffness = 0.19;
    const damping = 0.72;

    c.vx = (c.vx + (t.x - c.x) * stiffness) * damping;
    c.vy = (c.vy + (t.y - c.y) * stiffness) * damping;
    c.vs = (c.vs + (t.s - c.s) * stiffness) * damping;

    c.x += c.vx;
    c.y += c.vy;
    c.s += c.vs;

    el.style.transform = `translate3d(${c.x.toFixed(2)}px, ${c.y.toFixed(2)}px, 0) scale(${c.s.toFixed(4)})`;

    const done =
      Math.abs(t.x - c.x) < 0.04 &&
      Math.abs(t.y - c.y) < 0.04 &&
      Math.abs(t.s - c.s) < 0.001 &&
      Math.abs(c.vx) < 0.04 &&
      Math.abs(c.vy) < 0.04;

    if (done) {
      el.style.transform =
        t.s === 1 && t.x === 0 && t.y === 0
          ? ''
          : `translate3d(${t.x.toFixed(2)}px, ${t.y.toFixed(2)}px, 0) scale(${t.s.toFixed(4)})`;
      rafRef.current = null;
      return;
    }

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const ensureLoop = useCallback(() => {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }
    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(tick);
    }
  }, [tick]);

  const onPointerEnter = useCallback((e: React.PointerEvent<T>) => {
    if (e.pointerType === 'touch') return;
    rectRef.current = e.currentTarget.getBoundingClientRect();
    targetRef.current.s = hoverScale;
    ensureLoop();
  }, [ensureLoop, hoverScale]);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<T>) => {
      if (e.pointerType === 'touch') return;
      const rect = rectRef.current;
      if (!rect) return;
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      targetRef.current.x = Math.max(-7, Math.min(7, dx * strength));
      targetRef.current.y = Math.max(-5, Math.min(5, dy * strength));
      ensureLoop();
    },
    [ensureLoop, strength]
  );

  const onPointerLeave = useCallback(() => {
    rectRef.current = null;
    targetRef.current = { x: 0, y: 0, s: 1 };
    ensureLoop();
  }, [ensureLoop]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return {
    ref,
    magneticProps: {
      onPointerEnter,
      onPointerMove,
      onPointerLeave,
    },
  };
}
