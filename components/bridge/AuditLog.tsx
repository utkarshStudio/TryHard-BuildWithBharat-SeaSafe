"use client";

import { useState } from "react";
import {
  History,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Zap,
} from "lucide-react";
import { useBridgeStore } from "@/lib/store";
import { SCENARIOS_BY_ID } from "@/lib/scenarios";

const truncate = (s: string, n: number) =>
  s.length > n ? `${s.slice(0, n - 1)}…` : s;

export function AuditLog() {
  const audit = useBridgeStore((s) => s.audit);
  const phase = useBridgeStore((s) => s.phase);
  const [open, setOpen] = useState(false);

  const count = audit.length;
  const hideOnMobile = phase === "advisory";

  return (
    <div className={`fixed top-[72px] left-2 right-2 sm:top-auto sm:bottom-14 sm:left-4 sm:right-auto z-30 sm:max-w-[420px] ${hideOnMobile ? "hidden sm:block" : ""}`}>
      <div className="rounded-md bg-slate-900/90 backdrop-blur-sm border border-slate-700 shadow-xl overflow-hidden">
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-full px-3 py-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] text-slate-300 hover:text-slate-100 hover:bg-slate-800/60 transition-colors"
        >
          <History className="size-3.5 text-slate-400" />
          <span className="font-semibold">
            {count} decision{count === 1 ? "" : "s"} logged
          </span>
          <span className="ml-auto text-slate-500">
            {open ? (
              <ChevronDown className="size-3.5" />
            ) : (
              <ChevronUp className="size-3.5" />
            )}
          </span>
        </button>

        {open && count > 0 && (
          <ul className="max-h-[260px] overflow-y-auto border-t border-slate-800 divide-y divide-slate-800/60">
            {audit.map((e) => {
              const scenarioLabel =
                SCENARIOS_BY_ID[e.scenarioId]?.label ?? e.scenarioId;
              const accepted = e.action === "accept";
              const captainsCall = accepted && e.wasRecommended === false;
              return (
                <li key={e.id} className="px-3 py-2 text-[11px] leading-snug">
                  <div className="flex items-center gap-1.5">
                    {accepted ? (
                      <CheckCircle2 className="size-3 text-emerald-400" />
                    ) : (
                      <XCircle className="size-3 text-slate-500" />
                    )}
                    <span
                      className={`uppercase tracking-[0.15em] font-semibold ${
                        accepted ? "text-emerald-300" : "text-slate-400"
                      }`}
                    >
                      {e.action}
                    </span>
                    <span className="text-slate-500">·</span>
                    <span className="text-slate-300">{scenarioLabel}</span>
                    {captainsCall && (
                      <span className="inline-flex items-center gap-0.5 rounded-sm bg-amber-500/15 border border-amber-500/30 px-1 py-px text-[9px] uppercase tracking-widest font-semibold text-amber-300">
                        <Zap className="size-2.5" />
                        Captain&rsquo;s call
                      </span>
                    )}
                    <span className="ml-auto text-slate-500 tabular-nums">
                      {new Date(e.decidedAt).toLocaleTimeString()}
                    </span>
                  </div>
                  {accepted && e.acceptedRouteLabel && (
                    <div className="mt-0.5 text-slate-200">
                      {e.acceptedRouteLabel}
                    </div>
                  )}
                  <div className="mt-0.5 text-slate-400 font-mono text-[10px]">
                    {e.fromRouteId}
                    <span className="mx-1.5 text-slate-600">→</span>
                    {e.toRouteId ?? "(no change)"}
                  </div>
                  <div className="mt-0.5 text-slate-500 italic">
                    {truncate(e.rationale, 80)}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {open && count === 0 && (
          <div className="border-t border-slate-800 px-3 py-3 text-[11px] text-slate-500 italic">
            No decisions yet — assess an advisory to start the log.
          </div>
        )}
      </div>
    </div>
  );
}
