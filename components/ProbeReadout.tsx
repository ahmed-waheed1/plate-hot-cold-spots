import {
  CRITICAL_POINTS,
  KIND_LABEL,
  fmt,
  fmtInt,
  type CriticalPoint,
  type PointKind,
  type ProbeReading,
} from "@/lib/plate";

const KIND_STYLE: Record<PointKind, string> = {
  max: "bg-accent text-white",
  min: "bg-cold text-white",
  saddle: "bg-ink text-white",
  none: "bg-white text-ink border border-ink",
};

export function ProbeReadout({ reading }: { reading: ProbeReading }) {
  const rows: [string, string][] = [
    ["Position (x, y)", `(${fmt(reading.x)}, ${fmt(reading.y)}) m`],
    ["T", `${fmt(reading.T)} °C`],
    ["|∇T|", `${fmt(reading.grad)} °C/m`],
    ["D = −36xy", fmt(reading.D)],
  ];
  return (
    <div>
      <dl className="divide-y divide-line border-y border-line">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-4 py-2.5">
            <dt className="text-sm text-muted">{k}</dt>
            <dd className="font-mono text-[15px] font-bold tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>
      <p
        aria-live="polite"
        className={`mt-4 px-3 py-2.5 font-mono text-sm font-bold uppercase tracking-wide ${KIND_STYLE[reading.kind]}`}
      >
        {KIND_LABEL[reading.kind]}
      </p>
      <p className="mt-2 text-xs text-muted">
        Classified with the second derivative test when |∇T| &lt; 0.15.
      </p>
    </div>
  );
}

const JUMP_LABEL: Record<CriticalPoint["kind"], string> = {
  max: "MAX",
  min: "MIN",
  saddle: "Saddle",
};

export function CriticalJumpButtons({
  onJump,
  tone = "light",
}: {
  onJump: (p: CriticalPoint) => void;
  tone?: "light" | "dark";
}) {
  const base =
    tone === "light"
      ? "bg-card hover:bg-ink hover:text-white"
      : "bg-white/10 text-white hover:bg-white hover:text-ink";
  return (
    <div className="grid grid-cols-2 gap-2" role="group" aria-label="Jump to a critical point">
      {CRITICAL_POINTS.map((p) => (
        <button
          key={`${p.x},${p.y}`}
          type="button"
          onClick={() => onJump(p)}
          className={`px-3 py-2.5 text-left transition-colors ${base}`}
        >
          <span className="block text-xs font-semibold uppercase tracking-wide">
            {JUMP_LABEL[p.kind]}
          </span>
          <span className="block font-mono text-sm font-bold">
            ({fmtInt(p.x)}, {fmtInt(p.y)})
          </span>
        </button>
      ))}
    </div>
  );
}

export function ColorLegend({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <div
        aria-hidden
        className="h-3 w-full"
        style={{ background: "linear-gradient(90deg, #1F4EA8, #ffffff 50%, #D7263D)" }}
      />
      <div className="mt-1 flex justify-between font-mono text-xs">
        <span>46 °C</span>
        <span>50 °C</span>
        <span>54 °C</span>
      </div>
    </div>
  );
}
