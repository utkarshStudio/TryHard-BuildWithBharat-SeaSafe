"use client";

import { useEffect, useState } from "react";
import { Anchor, Plus } from "lucide-react";
import { useBridgeStore } from "@/lib/store";
import { fmtHrs } from "@/lib/utils";
import { ScenarioPicker } from "./ScenarioPicker";
import { NewScenarioModal } from "./bridge/NewScenarioModal";

export function BridgeHeader() {
  const scenario = useBridgeStore((s) => s.scenario);
  const scenarioId = useBridgeStore((s) => s.scenarioId);
  const activeRouteId = useBridgeStore((s) => s.activeRouteId);
  const activeRoute =
    scenario.routes.find((r) => r.id === activeRouteId) ?? scenario.routes[0];

  const [contentVisible, setContentVisible] = useState(true);
  const [showNewScenario, setShowNewScenario] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const frame = requestAnimationFrame(() => {
      setContentVisible(false);
      timer = setTimeout(() => setContentVisible(true), 200);
    });
    return () => {
      cancelAnimationFrame(frame);
      if (timer) clearTimeout(timer);
    };
  }, [scenarioId]);

  return (
    <header className="h-16 shrink-0 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-6 border-b border-slate-800 bg-slate-950/90 backdrop-blur-sm relative z-20">
      <div className="flex items-center gap-2.5 shrink-0">
        <Anchor className="size-5 text-emerald-400" strokeWidth={2.25} />
        <span className="font-semibold tracking-[0.18em] text-slate-100">
          SEASAFE
        </span>
      </div>

      <div
        className={`hidden lg:flex items-center gap-8 text-sm transition-opacity duration-200 ${
          contentVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="flex flex-col leading-tight">
          <span className="text-[10px] uppercase tracking-[0.15em] text-slate-500">
            Vessel
          </span>
          <span className="font-medium text-slate-100 inline-flex items-center gap-1.5">
            <span className="relative inline-flex size-1.5">
              <span className="absolute inset-0 rounded-full bg-emerald-400/60 animate-ping" />
              <span className="relative inline-block size-1.5 rounded-full bg-emerald-400" />
            </span>
            <span>{scenario.vessel.name}</span>
            <span className="ml-1.5 text-slate-500 font-normal tabular-nums">
              IMO {scenario.vessel.imo}
            </span>
          </span>
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-[10px] uppercase tracking-[0.15em] text-slate-500">
            Voyage
          </span>
          <span className="font-medium text-slate-100">
            {scenario.voyage.from.name}
            <span className="mx-1.5 text-slate-500">→</span>
            {scenario.voyage.to.name}
          </span>
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-[10px] uppercase tracking-[0.15em] text-slate-500">
            Course
          </span>
          <span className="font-medium text-slate-100 uppercase tracking-wide">
            {activeRoute.label}
          </span>
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-[10px] uppercase tracking-[0.15em] text-slate-500">
            ETA
          </span>
          <span className="font-medium text-slate-100 tabular-nums">
            {fmtHrs(activeRoute.etaHours)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <ScenarioPicker />
        <button
          onClick={() => setShowNewScenario(true)}
          aria-label="New Scenario"
          className="flex items-center gap-1.5 h-9 px-2.5 sm:px-3 rounded-md border border-slate-600 text-slate-300 text-[11px] uppercase tracking-widest font-semibold hover:border-amber-500 hover:text-amber-400 transition-colors"
        >
          <Plus className="size-3.5" />
          <span className="hidden sm:inline">New Scenario</span>
        </button>
      </div>

      {showNewScenario && (
        <NewScenarioModal onClose={() => setShowNewScenario(false)} />
      )}
    </header>
  );
}
