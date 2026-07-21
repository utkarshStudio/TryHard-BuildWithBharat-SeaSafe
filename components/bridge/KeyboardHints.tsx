"use client";

import { useState } from "react";
import { HelpCircle } from "lucide-react";

const SHORTCUTS: { keys: string[]; label: string }[] = [
  { keys: ["R"], label: "Replay scenario" },
  { keys: ["C"], label: "Compliance mode" },
  { keys: ["A"], label: "Accept recommendation" },
  { keys: ["Esc"], label: "Dismiss recommendation" },
  { keys: ["1", "2", "3", "4", "5"], label: "Switch scenario" },
];

export function KeyboardHints() {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="hidden sm:block fixed bottom-14 right-4 z-30"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {open && (
        <div className="absolute bottom-10 right-0 w-[240px] rounded-md bg-slate-900/95 backdrop-blur-sm border border-slate-700 shadow-xl p-3">
          <div className="text-[10px] uppercase tracking-[0.15em] text-slate-400 font-semibold mb-2">
            Keyboard shortcuts
          </div>
          <ul className="space-y-1.5">
            {SHORTCUTS.map((s) => (
              <li
                key={s.label}
                className="flex items-center justify-between text-[11px] text-slate-300"
              >
                <span>{s.label}</span>
                <span className="flex items-center gap-1">
                  {s.keys.map((k) => (
                    <kbd
                      key={k}
                      className="px-1.5 py-0.5 text-[10px] font-mono rounded border border-slate-700 bg-slate-800 text-slate-200 tabular-nums"
                    >
                      {k}
                    </kbd>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Show keyboard shortcuts"
        className="size-8 rounded-full bg-slate-900/90 backdrop-blur-sm border border-slate-700 flex items-center justify-center text-slate-300 hover:text-slate-100 hover:bg-slate-800 transition-colors shadow-md"
      >
        <HelpCircle className="size-4" />
      </button>
    </div>
  );
}
