"use client";

import { useEffect, useRef, useState } from "react";

const KEYWORDS = new Set(["import", "as", "for", "in", "if", "else", "True", "False"]);

/** Tiny Python highlighter: comments, strings, keywords. Enough for one file. */
function highlight(line: string, key: number) {
  const parts: React.ReactNode[] = [];
  const re = /(#.*$)|(f?"[^"]*"|'[^']*')|\b([A-Za-z_]+)\b/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(line))) {
    if (m.index > last) parts.push(line.slice(last, m.index));
    if (m[1]) parts.push(<span key={i++} className="text-[#8c8c8c]">{m[1]}</span>);
    else if (m[2]) parts.push(<span key={i++} className="text-[#ff9aa6]">{m[2]}</span>);
    else if (KEYWORDS.has(m[3])) parts.push(<span key={i++} className="font-bold text-white">{m[3]}</span>);
    else parts.push(m[0]);
    last = m.index + m[0].length;
  }
  if (last < line.length) parts.push(line.slice(last));
  return (
    <span key={key} className="block">
      {parts.length ? parts : " "}
    </span>
  );
}

export default function CodeBlock({ code, filename }: { code: string; filename: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    let ok = false;
    try {
      await navigator.clipboard.writeText(code);
      ok = true;
    } catch {
      // Fallback for non-secure contexts / older browsers.
      const ta = document.createElement("textarea");
      ta.value = code;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        ok = document.execCommand("copy");
      } catch {
        ok = false;
      }
      ta.remove();
    }
    setState(ok ? "copied" : "failed");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 2000);
  }

  return (
    <div className="bg-ink text-[#e6e6e6]">
      <div className="flex items-center justify-between border-b border-white/15 px-4 py-2.5 sm:px-6">
        <span className="font-mono text-sm text-white/70">{filename}</span>
        <button
          type="button"
          onClick={copy}
          className="bg-accent px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-accent-dark focus-visible:outline-white"
        >
          {state === "copied" ? "Copied" : state === "failed" ? "Copy failed" : "Copy"}
        </button>
        <span className="sr-only" aria-live="polite">
          {state === "copied" ? "Code copied to clipboard" : state === "failed" ? "Copy failed" : ""}
        </span>
      </div>
      <pre
        tabIndex={0}
        aria-label={`${filename} source code`}
        className="overflow-x-auto px-4 py-5 font-mono text-[13px] leading-6 sm:px-6 sm:text-sm"
      >
        <code>{code.replace(/\n$/, "").split("\n").map(highlight)}</code>
      </pre>
    </div>
  );
}
