/**
 * Heated plate model: T(x, y) = 50 + x³ − 3x − y³ + 3y  (°C)
 * Domain: −1.5 ≤ x, y ≤ 1.5 (m). Every number shown on the site comes from here.
 */

export const DOMAIN = { min: -1.5, max: 1.5 } as const;
export const T_MIN = 46;
export const T_MAX = 54;
export const T_MID = 50;
export const CONTOUR_STEP = 0.5;
/** |∇T| below this counts as "at a critical point" in the probe readout. */
export const CRITICAL_TOLERANCE = 0.15;

export const T = (x: number, y: number) => 50 + x ** 3 - 3 * x - y ** 3 + 3 * y;
export const Tx = (x: number) => 3 * x * x - 3;
export const Ty = (y: number) => 3 - 3 * y * y;
export const Txx = (x: number) => 6 * x;
export const Tyy = (y: number) => -6 * y;
export const Txy = 0;
/** D = T_xx·T_yy − T_xy² = −36xy */
export const D = (x: number, y: number) => Txx(x) * Tyy(y) - Txy * Txy;

export const gradient = (x: number, y: number) => ({ gx: Tx(x), gy: Ty(y) });
export const gradMagnitude = (x: number, y: number) => Math.hypot(Tx(x), Ty(y));

export type PointKind = "max" | "min" | "saddle" | "none";

/** Second derivative test, applied only when the probe sits (nearly) on a critical point. */
export function classify(x: number, y: number): PointKind {
  if (gradMagnitude(x, y) >= CRITICAL_TOLERANCE) return "none";
  const d = D(x, y);
  if (d < 0) return "saddle";
  if (d > 0) return Txx(x) < 0 ? "max" : "min";
  return "none"; // D = 0: test is inconclusive
}

export const KIND_LABEL: Record<PointKind, string> = {
  max: "local MAX",
  min: "local MIN",
  saddle: "SADDLE",
  none: "Not a critical point",
};

export type CriticalPoint = {
  x: number;
  y: number;
  T: number;
  D: number;
  kind: Exclude<PointKind, "none">;
};

export const CRITICAL_POINTS: CriticalPoint[] = [
  { x: -1, y: 1, T: T(-1, 1), D: D(-1, 1), kind: "max" },
  { x: 1, y: -1, T: T(1, -1), D: D(1, -1), kind: "min" },
  { x: 1, y: 1, T: T(1, 1), D: D(1, 1), kind: "saddle" },
  { x: -1, y: -1, T: T(-1, -1), D: D(-1, -1), kind: "saddle" },
];

export type ProbeReading = {
  x: number;
  y: number;
  T: number;
  grad: number;
  gx: number;
  gy: number;
  D: number;
  kind: PointKind;
};

export function probe(x: number, y: number): ProbeReading {
  const cx = clampToDomain(x);
  const cy = clampToDomain(y);
  return {
    x: cx,
    y: cy,
    T: T(cx, cy),
    grad: gradMagnitude(cx, cy),
    gx: Tx(cx),
    gy: Ty(cy),
    D: D(cx, cy),
    kind: classify(cx, cy),
  };
}

export const clampToDomain = (v: number) => Math.min(DOMAIN.max, Math.max(DOMAIN.min, v));

/* ---------- colour scale: blue (46) → white (50) → red (54) ---------- */

const COLD: [number, number, number] = [31, 78, 168]; // #1F4EA8
const WHITE: [number, number, number] = [255, 255, 255];
const HOT: [number, number, number] = [215, 38, 61]; // #D7263D

/** Returns sRGB components 0–255. */
export function tempToRgb(t: number): [number, number, number] {
  const s = Math.max(-1, Math.min(1, (t - T_MID) / (T_MAX - T_MID)));
  const [a, b, k] = s < 0 ? [WHITE, COLD, -s] : [WHITE, HOT, s];
  return [
    Math.round(a[0] + (b[0] - a[0]) * k),
    Math.round(a[1] + (b[1] - a[1]) * k),
    Math.round(a[2] + (b[2] - a[2]) * k),
  ];
}

export const COLD_HEX = "#1F4EA8";
export const HOT_HEX = "#D7263D";

/* ---------- formatting ---------- */

/** Fixed decimals with a true minus sign and no "−0.00". */
export function fmt(n: number, digits = 2): string {
  const s = n.toFixed(digits);
  if (Number(s) === 0) return (0).toFixed(digits);
  return s.replace("-", "−");
}

export const fmtInt = (n: number) => String(n).replace("-", "−");

/* ---------- contour segments (marching squares) for the 3D view ---------- */

/** Contour levels every 0.5 °C strictly inside (46, 54). */
export function contourLevels(): number[] {
  const out: number[] = [];
  for (let v = T_MIN + CONTOUR_STEP; v < T_MAX - 1e-9; v += CONTOUR_STEP) out.push(v);
  return out;
}

/**
 * Returns a flat list of segment endpoints [x1, y1, T1, x2, y2, T2, ...]
 * for every contour level, sampled on an n×n cell grid.
 */
export function contourSegments(n = 120): number[] {
  const step = (DOMAIN.max - DOMAIN.min) / n;
  const vals = new Float64Array((n + 1) * (n + 1));
  for (let j = 0; j <= n; j++)
    for (let i = 0; i <= n; i++)
      vals[j * (n + 1) + i] = T(DOMAIN.min + i * step, DOMAIN.min + j * step);

  const out: number[] = [];
  const levels = contourLevels();
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const x0 = DOMAIN.min + i * step;
      const y0 = DOMAIN.min + j * step;
      // corners: a(x0,y0) b(x1,y0) c(x1,y1) d(x0,y1)
      const a = vals[j * (n + 1) + i];
      const b = vals[j * (n + 1) + i + 1];
      const c = vals[(j + 1) * (n + 1) + i + 1];
      const d = vals[(j + 1) * (n + 1) + i];
      const lo = Math.min(a, b, c, d);
      const hi = Math.max(a, b, c, d);
      for (const L of levels) {
        if (L < lo || L > hi) continue;
        const pts: number[] = [];
        const edge = (v1: number, v2: number, px1: number, py1: number, px2: number, py2: number) => {
          if ((v1 < L) !== (v2 < L)) {
            const t = (L - v1) / (v2 - v1);
            pts.push(px1 + (px2 - px1) * t, py1 + (py2 - py1) * t);
          }
        };
        const x1 = x0 + step;
        const y1 = y0 + step;
        edge(a, b, x0, y0, x1, y0);
        edge(b, c, x1, y0, x1, y1);
        edge(c, d, x1, y1, x0, y1);
        edge(d, a, x0, y1, x0, y0);
        for (let k = 0; k + 3 < pts.length; k += 4) {
          out.push(pts[k], pts[k + 1], L, pts[k + 2], pts[k + 3], L);
        }
      }
    }
  }
  return out;
}
