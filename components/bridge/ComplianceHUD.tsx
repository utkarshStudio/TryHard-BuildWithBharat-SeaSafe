"use client";

import { useMemo } from "react";
import { useBridgeStore } from "@/lib/store";
import { computeMaskedRoute } from "@/lib/compliance/maskingEngine";
import { getScenarioComplianceProfile } from "@/lib/compliance/scenarioMasks";
import { INTERNATIONAL_COMPLIANCE_DEFAULT } from "@/lib/compliance/zones";

export function ComplianceHUD() {
  const scenario = useBridgeStore((s) => s.scenario);
  const activeRouteId = useBridgeStore((s) => s.activeRouteId);
  const complianceMode = useBridgeStore((s) => s.complianceMode);
  const vesselProgress = useBridgeStore((s) => s.vesselProgress);

  const profile = useMemo(
    () => getScenarioComplianceProfile(scenario),
    [scenario],
  );
  const activeRoute =
    scenario.routes.find((route) => route.id === activeRouteId) ??
    scenario.routes[0];
  const masked = useMemo(
    () => computeMaskedRoute(activeRoute?.waypoints ?? [], vesselProgress),
    [activeRoute, vesselProgress],
  );
  const activeZone = masked.activeZone;

  if (!complianceMode || !profile) return null;

  const zoneContext = activeZone ?? {
    label: "International Waters - IMO Default",
    legalBasis: INTERNATIONAL_COMPLIANCE_DEFAULT.legalBasis,
    lookAheadNm: INTERNATIONAL_COMPLIANCE_DEFAULT.lookAheadNm,
    disposalHours: INTERNATIONAL_COMPLIANCE_DEFAULT.disposalHours,
    hudColor: "text-slate-300",
  };

  const progressPct = Math.round(vesselProgress * 100);
  const disposal =
    zoneContext.disposalHours === 0
      ? "Immediate on exit"
      : `${zoneContext.disposalHours} h after transit`;

  return (
    <section className="hidden sm:block fixed bottom-32 left-4 z-30 w-72 rounded-md bg-slate-900/90 backdrop-blur-sm border border-slate-700 shadow-xl overflow-hidden">
      <div className="px-3 py-2 border-b border-slate-800 flex items-center gap-2">
        <span className="animate-pulse" aria-hidden="true">
          🛡
        </span>
        <h2 className="text-[10px] uppercase tracking-[0.16em] font-semibold text-slate-100">
          Data Compliance Mode
        </h2>
      </div>

      <div className="px-3 py-2.5 space-y-1.5 text-[11px]">
        <div className="grid grid-cols-[82px_1fr] gap-2">
          <span className="text-slate-500 uppercase tracking-widest">
            Active Zone
          </span>
          <span className={`font-semibold ${zoneContext.hudColor}`}>
            {zoneContext.label}
          </span>
        </div>
        <div className="grid grid-cols-[82px_1fr] gap-2">
          <span className="text-slate-500 uppercase tracking-widest">Law</span>
          <span className="text-slate-300 leading-snug">
            {zoneContext.legalBasis}
          </span>
        </div>
        <div className="grid grid-cols-[82px_1fr] gap-2">
          <span className="text-slate-500 uppercase tracking-widest">
            Look-Ahead
          </span>
          <span className="text-slate-100 tabular-nums">
            {zoneContext.lookAheadNm} nm
          </span>
        </div>
        <div className="grid grid-cols-[82px_1fr] gap-2">
          <span className="text-slate-500 uppercase tracking-widest">
            Disposal
          </span>
          <span className="text-slate-100">{disposal}</span>
        </div>
      </div>

      <div className="border-t border-slate-800 px-3 py-2.5">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.14em] text-slate-400 mb-1.5">
          <span>Route Progress</span>
          <span className="text-amber-300 tabular-nums">{progressPct}%</span>
        </div>
        <div className="h-2 rounded-sm bg-slate-700 overflow-hidden">
          <div
            className="h-full bg-amber-500 transition-[width] duration-150"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="mt-2 text-[11px] text-slate-400">
          Segments masked:{" "}
          <span className="text-slate-100 tabular-nums">
            {masked.maskedSegmentCount} of {activeRoute.waypoints.length}
          </span>{" "}
          waypoints disposed
        </p>
      </div>
    </section>
  );
}
