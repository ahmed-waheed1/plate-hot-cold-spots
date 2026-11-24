"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useState } from "react";
import { probe } from "@/lib/plate";
import { ColorLegend, CriticalJumpButtons, ProbeReadout } from "./ProbeReadout";
import type { ViewName } from "./PlateScene";

const PlateScene = dynamic(() => import("./PlateScene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-white font-mono text-sm text-muted">
      Loading 3D plate…
    </div>
  ),
});

const VIEWS: { id: ViewName; label: string }[] = [
  { id: "top", label: "Top" },
  { id: "angled", label: "Angled" },
  { id: "side", label: "Side" },
];

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 py-1.5 text-sm font-semibold">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 cursor-pointer appearance-none border-2 border-ink bg-white checked:bg-accent checked:shadow-[inset_0_0_0_3px_white]"
      />
      {label}
    </label>
  );
}

export default function ExploreClient() {
  const [pos, setPos] = useState({ x: -1, y: 1 });
  const [contours, setContours] = useState(true);
  const [arrows, setArrows] = useState(false);
  const [view, setView] = useState<{ name: ViewName; n: number }>({ name: "angled", n: 0 });
  const reading = probe(pos.x, pos.y);

  const onProbe = useCallback((x: number, y: number) => setPos({ x, y }), []);

  return (
    <div className="flex min-h-dvh flex-col lg:h-dvh lg:overflow-hidden">
      <header className="flex items-center justify-between gap-4 border-b border-ink bg-white px-4 py-3 sm:px-6">
        <Link href="/" className="text-sm font-semibold underline-offset-4 hover:underline">
          ← Back to project
        </Link>
        <h1 className="truncate font-display text-base font-bold sm:text-lg">
          3D plate <span className="hidden font-sans font-normal text-muted sm:inline">· T(x, y) = 50 + x³ − 3x − y³ + 3y</span>
        </h1>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <main
          className="relative h-[62dvh] min-h-[340px] bg-white lg:h-auto lg:flex-1"
          aria-label="3D surface of the plate temperature. Drag to rotate, scroll or pinch to zoom, hover or tap the surface to probe."
        >
          <PlateScene
            probeX={reading.x}
            probeY={reading.y}
            showContours={contours}
            showArrows={arrows}
            view={view}
            onProbe={onProbe}
          />
          <div className="pointer-events-none absolute bottom-3 left-3 w-48 bg-white/90 p-2">
            <ColorLegend />
          </div>
        </main>

        <aside
          className="w-full shrink-0 overflow-y-auto border-t border-ink bg-white p-5 lg:w-[340px] lg:border-l lg:border-t-0 sm:p-6"
          aria-label="Probe and view controls"
        >
          <h2 className="font-display text-xl font-bold">Probe</h2>
          <p className="mt-1 text-sm text-muted">Hover or tap the surface.</p>
          <div className="mt-4">
            <ProbeReadout reading={reading} />
          </div>

          <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide">Jump to</h2>
          <div className="mt-3">
            <CriticalJumpButtons onJump={(p) => setPos({ x: p.x, y: p.y })} />
          </div>

          <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide">Layers</h2>
          <div className="mt-2">
            <Toggle label="Show contour lines" checked={contours} onChange={setContours} />
            <Toggle label="Show gradient arrows" checked={arrows} onChange={setArrows} />
          </div>

          <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide" id="view-label">
            View
          </h2>
          <div className="mt-3 grid grid-cols-3 gap-2" role="group" aria-labelledby="view-label">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                type="button"
                aria-pressed={view.name === v.id}
                onClick={() => setView((cur) => ({ name: v.id, n: cur.n + 1 }))}
                className={`py-2.5 text-sm font-semibold transition-colors ${
                  view.name === v.id ? "bg-accent text-white" : "bg-card hover:bg-ink hover:text-white"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
