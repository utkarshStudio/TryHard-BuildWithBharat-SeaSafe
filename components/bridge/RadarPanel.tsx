"use client";

import { useEffect, useMemo, useState } from "react";
import { Radar } from "lucide-react";
import { useBridgeStore } from "@/lib/store";
import { computeRadarScores } from "@/lib/radar/scores";
import { RouteRadarChart } from "./RouteRadarChart";

export function RadarPanel() {
  const phase = useBridgeStore((s) => s.phase);
  const decision = useBridgeStore((s) => s.agent.output);
  const toolCalls = useBridgeStore((s) => s.agent.toolCalls);
  const selectedRouteId = useBridgeStore((s) => s.agent.selectedRouteId);
  const selectRoute = useBridgeStore((s) => s.selectRoute);
  const scenario = useBridgeStore((s) => s.scenario);

  const visible = phase === "decision" && decision != null;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(visible));
    return () => cancelAnimationFrame(id);
  }, [visible]);

  const radarScores = useMemo(
    () =>
      scenario && toolCalls.length > 0
        ? computeRadarScores(scenario, toolCalls)
        : [],
    [scenario, toolCalls],
  );

  if (!visible || !decision || radarScores.length !== 3) return null;

  return (
    <div
      className={`hidden sm:block fixed top-20 left-6 z-30 w-[420px] max-h-[calc(100vh-7rem)] overflow-y-auto transition-all duration-300 ease-out ${
        mounted
          ? "translate-y-0 opacity-100"
          : "-translate-y-4 opacity-0 pointer-events-none"
      }`}
    >
      <div className="rounded-xl bg-slate-900/95 backdrop-blur-md border border-slate-700 shadow-2xl overflow-hidden">
        <div className="px-5 pt-4 pb-3 border-b border-slate-800 flex items-center gap-2">
          <Radar className="size-4 text-emerald-400" />
          <span className="text-[10px] uppercase tracking-[0.15em] font-semibold text-emerald-300">
            Route Comparison
          </span>
        </div>

        <div className="px-5 py-5">
          <RouteRadarChart
            routeScores={radarScores}
            selectedRouteId={selectedRouteId}
            onRouteClick={selectRoute}
            recommendedRouteId={decision.recommendedRouteId}
            alternativeRouteIds={decision.alternativeRouteIds}
          />
        </div>

        <div className="px-5 pb-4 text-[10px] leading-relaxed text-slate-500">
          Outer edge = more of that dimension. A safer, cheaper, greener route
          stays small on{" "}
          <span className="text-slate-300">RISK · COST · CARBON</span>; a faster
          and more reliable one reaches outward on{" "}
          <span className="text-slate-300">SPEED · RELIABILITY</span>.
        </div>
      </div>
    </div>
  );
}
