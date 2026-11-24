import Image from "next/image";
import Link from "next/link";
import HeatMap from "@/components/HeatMap";
import CodeBlock from "@/components/CodeBlock";
import { PLATE_OUTPUT, PLATE_PY, TEAM } from "@/lib/content";

const NAV = [
  { href: "#explore", label: "Explore" },
  { href: "#model", label: "Model" },
  { href: "#code", label: "Code" },
  { href: "#team", label: "Team" },
];

function SectionHead({ num, title, id }: { num: string; title: string; id: string }) {
  return (
    <div className="grid gap-2 border-t-4 border-ink pt-5 md:grid-cols-[120px_1fr]">
      <span className="font-mono text-sm font-bold text-accent">{num}</span>
      <h2 id={id} className="font-display text-3xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
        {title}
      </h2>
    </div>
  );
}

function EqCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-card p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <div className="mt-3 font-mono text-[15px] leading-7 sm:text-base">{children}</div>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-ink focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>

      {/* ---------- Top bar ---------- */}
      <header className="bg-white">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-5 px-5 pt-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <Link href="/" aria-label="Badr University in Cairo — home" className="shrink-0">
            <Image src="/buc-logo.png" alt="Badr University in Cairo" width={176} height={64} priority className="h-12 w-auto sm:h-16" />
          </Link>
          <p className="text-sm leading-5 sm:text-right">
            <span className="block font-semibold">Faculty of Engineering &amp; Technology</span>
            <span className="block">Basic Science Department</span>
            <span className="block text-muted">Math 3 · BAS 113 · Fall 2026–2027</span>
          </p>
        </div>
        <nav aria-label="Main" className="mx-auto mt-5 max-w-[1200px] px-5 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink py-3">
            <ul className="flex flex-wrap gap-x-6 gap-y-1 text-sm font-semibold">
              {NAV.map((n) => (
                <li key={n.href}>
                  <a href={n.href} className="underline-offset-4 hover:underline">
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
            <Link
              href="/explore"
              className="bg-accent px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-accent-dark"
            >
              3D plate →
            </Link>
          </div>
        </nav>
      </header>

      <main id="main" className="flex-1">
        {/* ---------- Hero ---------- */}
        <section className="on-red bg-accent text-white" aria-labelledby="hero-title">
          <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8 sm:py-24">
            <p className="font-mono text-sm font-bold uppercase tracking-wider">
              Critical points · second derivative test
            </p>
            <h1
              id="hero-title"
              className="mt-6 max-w-[15ch] font-display text-[2.6rem] font-extrabold leading-[0.98] tracking-tight sm:text-7xl lg:text-[5.5rem]"
            >
              Finding the Hot and Cold Spots on a Heated Plate
            </h1>
            <p className="mt-8 max-w-[44ch] text-lg leading-relaxed sm:text-xl">
              Where is a 3&nbsp;m × 3&nbsp;m metal plate hottest, coldest, and where are its saddle
              points?
            </p>
            <dl className="mt-14 grid border-t border-white/60 sm:grid-cols-3">
              {[
                ["Hot spot", "54 °C"],
                ["Cold spot", "46 °C"],
                ["Saddles", "2 × 50 °C"],
              ].map(([k, v], i) => (
                <div
                  key={k}
                  className={`border-white/60 py-5 sm:pr-6 ${i > 0 ? "border-t sm:border-l sm:border-t-0 sm:pl-6" : ""}`}
                >
                  <dt className="text-sm font-semibold uppercase tracking-wide text-white/85">{k}</dt>
                  <dd className="mt-1 font-mono text-3xl font-bold sm:text-4xl">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <div className="mx-auto max-w-[1200px] space-y-28 px-5 py-20 sm:px-8 sm:py-28">
          {/* ---------- 01 Explore ---------- */}
          <section id="explore" aria-labelledby="explore-title">
            <SectionHead num="01" title="Explore the plate" id="explore-title" />
            <div className="mt-10 md:pl-[120px]">
              <p className="mb-10 max-w-[60ch] text-lg leading-relaxed">
                Each pixel is a point on the plate, coloured by its temperature. Move over the map
                (or tap it, or focus it and use the arrow keys) to read the temperature, the
                gradient and the discriminant D at that point.
              </p>
              <HeatMap />
            </div>
          </section>

          {/* ---------- 02 Model ---------- */}
          <section id="model" aria-labelledby="model-title">
            <SectionHead num="02" title="The mathematical model" id="model-title" />
            <div className="mt-10 md:pl-[120px]">
              <div className="grid gap-4 md:grid-cols-2">
                <EqCard label="Temperature">
                  T(x, y) = 50 + x³ − 3x − y³ + 3y&nbsp;&nbsp;°C
                  <br />
                  <span className="text-muted">−1.5 ≤ x, y ≤ 1.5 m</span>
                </EqCard>
                <EqCard label="First partial derivatives">
                  T<sub>x</sub> = 3x² − 3
                  <br />
                  T<sub>y</sub> = 3 − 3y²
                </EqCard>
                <EqCard label="Critical points: ∇T = 0">
                  3x² − 3 = 0 ⇒ x = ±1
                  <br />3 − 3y² = 0 ⇒ y = ±1
                </EqCard>
                <EqCard label="Second partial derivatives">
                  T<sub>xx</sub> = 6x&nbsp;&nbsp;&nbsp;T<sub>yy</sub> = −6y&nbsp;&nbsp;&nbsp;T<sub>xy</sub> = 0
                  <br />D = T<sub>xx</sub>·T<sub>yy</sub> − T<sub>xy</sub>² = −36xy
                </EqCard>
              </div>

              <div className="mt-4 overflow-x-auto bg-card">
                <table className="w-full min-w-[520px] text-left font-mono text-[15px]">
                  <caption className="sr-only">Second derivative test at each critical point</caption>
                  <thead>
                    <tr className="border-b border-ink text-xs uppercase tracking-wide">
                      <th scope="col" className="px-5 py-3 font-sans font-semibold">Point</th>
                      <th scope="col" className="px-5 py-3 font-sans font-semibold">D</th>
                      <th scope="col" className="px-5 py-3 font-sans font-semibold">T<sub>xx</sub></th>
                      <th scope="col" className="px-5 py-3 font-sans font-semibold">T (°C)</th>
                      <th scope="col" className="px-5 py-3 font-sans font-semibold">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    <tr>
                      <th scope="row" className="px-5 py-3 font-bold">(−1, 1)</th>
                      <td className="px-5 py-3">36 &gt; 0</td>
                      <td className="px-5 py-3">−6 &lt; 0</td>
                      <td className="px-5 py-3 font-bold">54</td>
                      <td className="px-5 py-3 font-bold text-accent">max</td>
                    </tr>
                    <tr>
                      <th scope="row" className="px-5 py-3 font-bold">(1, −1)</th>
                      <td className="px-5 py-3">36 &gt; 0</td>
                      <td className="px-5 py-3">6 &gt; 0</td>
                      <td className="px-5 py-3 font-bold">46</td>
                      <td className="px-5 py-3 font-bold text-cold">min</td>
                    </tr>
                    <tr>
                      <th scope="row" className="px-5 py-3 font-bold">(1, 1)</th>
                      <td className="px-5 py-3">−36 &lt; 0</td>
                      <td className="px-5 py-3">6</td>
                      <td className="px-5 py-3 font-bold">50</td>
                      <td className="px-5 py-3 font-bold">saddle</td>
                    </tr>
                    <tr>
                      <th scope="row" className="px-5 py-3 font-bold">(−1, −1)</th>
                      <td className="px-5 py-3">−36 &lt; 0</td>
                      <td className="px-5 py-3">−6</td>
                      <td className="px-5 py-3 font-bold">50</td>
                      <td className="px-5 py-3 font-bold">saddle</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-10 border-l-8 border-accent bg-white py-2 pl-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Answer</p>
                <p className="mt-2 font-mono text-lg font-bold leading-relaxed sm:text-xl">
                  max 54 °C at (−1, 1) · min 46 °C at (1, −1) · saddles at (±1, ±1)
                </p>
              </div>
            </div>
          </section>

          {/* ---------- 03 Code ---------- */}
          <section id="code" aria-labelledby="code-title">
            <SectionHead num="03" title="The software code" id="code-title" />
            <div className="mt-10 md:pl-[120px]">
              <p className="mb-8 max-w-[60ch] text-lg leading-relaxed">
                The same steps in Python with SymPy: solve ∇T = 0 symbolically, then apply the
                second derivative test to each solution.
              </p>
              <CodeBlock code={PLATE_PY} filename="plate.py" />
              <p className="mt-8 text-xs font-semibold uppercase tracking-wide text-muted">Output</p>
              <pre
                tabIndex={0}
                aria-label="Program output"
                className="mt-2 overflow-x-auto bg-card px-4 py-5 font-mono text-[13px] leading-6 sm:px-6 sm:text-sm"
              >
                {PLATE_OUTPUT}
              </pre>
              <p className="mt-10 max-w-[52ch] font-display text-2xl font-bold leading-snug sm:text-3xl">
                The code finds the same four points as the hand solution, and they are the hottest
                and coldest points on the plate.
              </p>
            </div>
          </section>

          {/* ---------- 04 Team ---------- */}
          <section id="team" aria-labelledby="team-title">
            <SectionHead num="04" title="Team" id="team-title" />
            <div className="mt-10 md:pl-[120px]">
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {TEAM.map((m) => (
                  <li key={m.id} className="flex flex-col justify-between gap-6 bg-card p-5">
                    <p className="font-display text-lg font-bold leading-tight">{m.name}</p>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm">{m.id}</span>
                      <span className="bg-ink px-2 py-0.5 font-mono text-xs font-bold text-white">MET</span>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-10 border-t border-ink pt-5 text-lg">
                Supervised by <strong>Assoc. Prof. Dr. Mourad Semary</strong>
              </p>
            </div>
          </section>
        </div>
      </main>

      {/* ---------- Footer ---------- */}
      <footer className="bg-ink text-white">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-2 px-5 py-10 text-sm sm:flex-row sm:justify-between sm:px-8">
          <p>
            <strong>Badr University in Cairo</strong> · Faculty of Engineering &amp; Technology · Basic Science Department
          </p>
          <p className="font-mono">Math 3 (BAS 113) · Fall 2026–2027</p>
        </div>
      </footer>
    </>
  );
}
