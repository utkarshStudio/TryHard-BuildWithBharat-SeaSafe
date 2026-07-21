"use client";

import { useEffect, useState } from "react";
import type { PortCongestionResult, ToolCall } from "@/lib/types";
import { fmtNum, fmtSigned, fmtUsd, fmtUsdSigned } from "@/lib/utils";

const truncate = (s: string, n: number) =>
  s.length > n ? `${s.slice(0, n - 1)}…` : s;

const STATUS_LABELS: Record<string, string> = {
  active_threat: "Active threat",
  piracy_active: "Piracy active",
  restricted: "Restricted transit",
  extreme_weather: "🌀 Extreme weather",
};

const CONGESTION_COLOR: Record<PortCongestionResult["status"], string> = {
  clear: "text-emerald-400",
  moderate: "text-amber-300",
  congested: "text-amber-500",
  critical: "text-red-400",
};

const CONGESTION_ICON: Record<PortCongestionResult["status"], string> = {
  clear: "🟢",
  moderate: "🟡",
  congested: "🟠",
  critical: "🔴",
};

function formatResult(tc: ToolCall): string {
  const r = tc.result as Record<string, unknown>;
  if (!r || typeof r !== "object") return "—";

  if (tc.name === "check_chokepoint_status") {
    const sev = r.severity as number;
    const status = r.status as string;
    const summary = (r.summary as string | undefined) ?? "";
    const statusLabel = STATUS_LABELS[status] ?? status;
    return `severity ${sev} · ${statusLabel} · ${truncate(summary, 60)}`;
  }
  if (tc.name === "check_weather_hazards") {
    const hazardous = Boolean(r.hazardous);
    const hazards = Array.isArray(r.hazards) ? r.hazards : [];
    const maxSeverity = (r.maxSeverity as number | undefined) ?? 0;
    const recommendation = (r.recommendation as string | undefined) ?? "";
    const impact = (r.projectedImpactHours as number | undefined) ?? 0;
    return hazardous
      ? `hazardous · severity ${maxSeverity} · ${hazards.length} zone${
          hazards.length === 1 ? "" : "s"
        } · impact ${impact} h · ${truncate(recommendation, 64)}`
      : `clear · ${truncate(recommendation, 78)}`;
  }
  if (tc.name === "calculate_route_metrics") {
    const distance = r.distance_nm as number;
    const eta = r.eta_hours as number;
    const fuel = r.fuel_burn_tons as number;
    const fuelUsd = r.fuel_cost_usd as number;
    const co2 = r.co2_tons as number;
    return `${fmtNum(distance)} nm · ${fmtNum(eta)} h · ${fmtNum(fuel)} t fuel · ${fmtUsd(fuelUsd)} · ${fmtNum(co2)} t CO₂`;
  }
  if (tc.name === "compare_routes") {
    const eta = r.eta_delta_hours as number;
    const fuelTons = r.fuel_delta_tons as number;
    const fuelUsd = r.fuel_delta_usd as number;
    const co2 = r.co2_delta_tons as number;
    return `${fmtSigned(eta, "h")} · ${fmtSigned(fuelTons, "t")} · ${fmtUsdSigned(fuelUsd)} · ${fmtSigned(co2, " t CO₂")}`;
  }
  return JSON.stringify(r);
}

function renderPortCongestion(tc: ToolCall) {
  const r = tc.result as PortCongestionResult;
  if (!r || typeof r !== "object" || !("status" in r)) return null;
  const icon = CONGESTION_ICON[r.status] ?? "🟢";
  const color = CONGESTION_COLOR[r.status] ?? "text-slate-300";
  return (
    <>
      <div className="mt-1 ml-5 text-[12px] leading-snug text-slate-300 tabular-nums">
        <span className="text-slate-500 mr-1.5">→</span>
        <span className="mr-1">{icon}</span>
        <span className={`uppercase tracking-wide font-semibold ${color}`}>
          {r.status}
        </span>
        <span className="text-slate-400">
          {" · "}
          {r.berthOccupancyPct}% berth occupancy · {r.anchorQueueVessels}{" "}
          {r.anchorQueueVessels === 1 ? "vessel" : "vessels"} at anchor · ~
          {r.estimatedWaitHours} h wait
        </span>
      </div>
      <div className="mt-0.5 ml-5 text-[11px] leading-snug text-slate-400">
        <span className="text-slate-200">{r.portName}</span>
        <span className="text-slate-500"> — </span>
        <span className="italic">{truncate(r.note, 80)}</span>
      </div>
    </>
  );
}

export function ToolCallRow({ tc, index = 0 }: { tc: ToolCall; index?: number }) {
  const argsStr = JSON.stringify(tc.args);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShown(true), Math.min(index, 6) * 150);
    return () => clearTimeout(t);
  }, [index]);

  const isPortCongestion = tc.name === "check_port_congestion";

  return (
    <div
      className={`px-4 py-2.5 border-b border-slate-800/60 hover:bg-slate-800/30 transition-all duration-200 ease-out ${
        shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <div className="font-mono text-[12px] leading-snug text-cyan-300 truncate">
          <span className="text-slate-500 mr-1">🔧</span>
          <span>{tc.name}</span>
          <span className="text-slate-500">({argsStr})</span>
        </div>
        <span className="font-mono text-[10px] text-slate-500 tabular-nums shrink-0">
          {tc.durationMs} ms
        </span>
      </div>
      {isPortCongestion ? (
        renderPortCongestion(tc)
      ) : (
        <div className="mt-1 ml-5 text-[12px] leading-snug text-slate-300 tabular-nums">
          <span className="text-slate-500 mr-1.5">→</span>
          <span>{formatResult(tc)}</span>
        </div>
      )}
    </div>
  );
}
