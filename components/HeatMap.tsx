"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CONTOUR_STEP,
  CRITICAL_POINTS,
  DOMAIN,
  T,
  T_MIN,
  probe,
  tempToRgb,
} from "@/lib/plate";
import { ColorLegend, CriticalJumpButtons, ProbeReadout } from "./ProbeReadout";

const SPAN = DOMAIN.max - DOMAIN.min;
const MAX_RENDER_PX = 900;

export default function HeatMap() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const baseRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState(0); // CSS px
  const [pos, setPos] = useState({ x: 0.4, y: 0.6 });
  const reading = probe(pos.x, pos.y);

  // Track container width.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setSize(Math.floor(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Paint the heat map + 0.5 °C contours once per size.
  useEffect(() => {
    const canvas = baseRef.current;
    if (!canvas || size === 0) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const R = Math.min(MAX_RENDER_PX, Math.round(size * dpr));
    canvas.width = R;
    canvas.height = R;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = ctx.createImageData(R, R);
    const band = new Int16Array(R * R);
    for (let j = 0; j < R; j++) {
      const y = DOMAIN.max - ((j + 0.5) / R) * SPAN;
      for (let i = 0; i < R; i++) {
        const x = DOMAIN.min + ((i + 0.5) / R) * SPAN;
        const t = T(x, y);
        const k = j * R + i;
        band[k] = Math.floor((t - T_MIN) / CONTOUR_STEP);
        const [r, g, b] = tempToRgb(t);
        img.data[k * 4] = r;
        img.data[k * 4 + 1] = g;
        img.data[k * 4 + 2] = b;
        img.data[k * 4 + 3] = 255;
      }
    }
    // Thin contour lines where the 0.5 °C band changes to the right or below.
    const lineAlpha = 0.45;
    for (let j = 0; j < R - 1; j++) {
      for (let i = 0; i < R - 1; i++) {
        const k = j * R + i;
        if (band[k] !== band[k + 1] || band[k] !== band[k + R]) {
          for (let c = 0; c < 3; c++) {
            img.data[k * 4 + c] = Math.round(img.data[k * 4 + c] * (1 - lineAlpha) + 17 * lineAlpha);
          }
        }
      }
    }
    ctx.putImageData(img, 0, 0);
  }, [size]);

  // Overlay: critical point markers, crosshair, gradient arrow.
  useEffect(() => {
    const canvas = overlayRef.current;
    if (!canvas || size === 0) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);

    const toPx = (x: number, y: number) => [
      ((x - DOMAIN.min) / SPAN) * size,
      ((DOMAIN.max - y) / SPAN) * size,
    ];

    // Critical point markers
    for (const p of CRITICAL_POINTS) {
      const [px, py] = toPx(p.x, p.y);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "#111111";
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      if (p.kind === "saddle") {
        ctx.rect(px - 4, py - 4, 8, 8);
      } else {
        ctx.arc(px, py, 4.5, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.stroke();
    }

    const [cx, cy] = toPx(reading.x, reading.y);

    // Crosshair
    ctx.strokeStyle = "rgba(17,17,17,0.55)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(size, cy);
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, size);
    ctx.stroke();
    ctx.setLineDash([]);

    // Gradient arrow (screen y is flipped)
    if (reading.grad > 1e-6) {
      const pxPerM = size / SPAN;
      const len = Math.max(14, 0.12 * reading.grad * pxPerM);
      const ux = reading.gx / reading.grad;
      const uy = -reading.gy / reading.grad;
      const ex = cx + ux * len;
      const ey = cy + uy * len;
      ctx.strokeStyle = "#111111";
      ctx.fillStyle = "#111111";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(ex - ux * 8, ey - uy * 8);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - ux * 11 - uy * 5.5, ey - uy * 11 + ux * 5.5);
      ctx.lineTo(ex - ux * 11 + uy * 5.5, ey - uy * 11 - ux * 5.5);
      ctx.closePath();
      ctx.fill();
    }

    // Probe dot
    ctx.fillStyle = "#111111";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }, [size, reading.x, reading.y, reading.gx, reading.gy, reading.grad]);

  const moveTo = useCallback(
    (clientX: number, clientY: number) => {
      const rect = overlayRef.current?.getBoundingClientRect();
      if (!rect || rect.width === 0) return;
      const x = DOMAIN.min + ((clientX - rect.left) / rect.width) * SPAN;
      const y = DOMAIN.max - ((clientY - rect.top) / rect.height) * SPAN;
      const p = probe(x, y);
      setPos({ x: p.x, y: p.y });
    },
    [],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 0.25 : 0.05;
    const d: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, step],
      ArrowDown: [0, -step],
    };
    const delta = d[e.key];
    if (!delta) return;
    e.preventDefault();
    const p = probe(pos.x + delta[0], pos.y + delta[1]);
    setPos({ x: Math.round(p.x * 100) / 100, y: Math.round(p.y * 100) / 100 });
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-14">
      <figure className="m-0">
        <div className="flex gap-2">
          {/* y-axis */}
          <div className="flex w-8 shrink-0 flex-col justify-between py-0 text-right font-mono text-[11px] text-muted" aria-hidden>
            <span>1.5</span>
            <span className="-rotate-90 whitespace-nowrap font-sans font-semibold text-ink">y (m)</span>
            <span>−1.5</span>
          </div>
          <div className="min-w-0 flex-1">
            <div ref={wrapRef} className="relative aspect-square w-full max-w-[640px] bg-card">
              <canvas ref={baseRef} className="absolute inset-0 h-full w-full" aria-hidden />
              <canvas
                ref={overlayRef}
                tabIndex={0}
                role="application"
                aria-roledescription="interactive heat map"
                aria-label="Heat map of plate temperature from x = −1.5 to 1.5 m and y = −1.5 to 1.5 m. Move the pointer or tap to probe; use arrow keys to move the probe, hold Shift for bigger steps. Readings appear in the panel beside the map."
                aria-describedby="probe-readout"
                className="absolute inset-0 h-full w-full cursor-crosshair touch-none"
                onPointerMove={(e) => moveTo(e.clientX, e.clientY)}
                onPointerDown={(e) => moveTo(e.clientX, e.clientY)}
                onKeyDown={onKeyDown}
              />
            </div>
            {/* x-axis */}
            <div className="mt-1 flex max-w-[640px] justify-between font-mono text-[11px] text-muted" aria-hidden>
              <span>−1.5</span>
              <span className="font-sans font-semibold text-ink">x (m)</span>
              <span>1.5</span>
            </div>
          </div>
        </div>
        <figcaption className="mt-6 max-w-[640px] pl-10">
          <ColorLegend />
          <p className="mt-3 text-sm text-muted">
            Contour lines every 0.5 °C. Circles mark the extremes, squares the saddles. The black
            arrow is ∇T, pointing toward the fastest temperature increase.
          </p>
        </figcaption>
      </figure>

      <aside aria-labelledby="probe-title">
        <h3 id="probe-title" className="font-display text-xl font-bold">
          Probe
        </h3>
        <div id="probe-readout" className="mt-4">
          <ProbeReadout reading={reading} />
        </div>
        <h4 className="mt-8 text-sm font-semibold uppercase tracking-wide">Jump to</h4>
        <div className="mt-3">
          <CriticalJumpButtons onJump={(p) => setPos({ x: p.x, y: p.y })} />
        </div>
      </aside>
    </div>
  );
}
