"use client";

import { useEffect, useState } from "react";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBridgeStore } from "@/lib/store";
import { cn, fmtSigned, fmtUsdSigned } from "@/lib/utils";
import type { Route, ToolCall } from "@/lib/types";

const tone = (n: number) =>
  n > 0
    ? "text-amber-300"
    : n < 0
      ? "text-emerald-300"
      : "text-slate-400";

interface RouteDeltas {
  etaHours: number;
  fuelTons: number;
  fuelUsd: number;
  co2Tons: number;
}

const ZERO_DELTAS: RouteDeltas = {
  etaHours: 0,
  fuelTons: 0,
  fuelUsd: 0,
  co2Tons: 0,
};

function findCompareDeltas(
  toolCalls: ToolCall[],
  fromId: string,
  toId: string,
): RouteDeltas | null {
  const tc = toolCalls.find(
    (c) =>
      c.name === "compare_routes" &&
      (c.args as Record<string, string>).route_a_id === fromId &&
      (c.args as Record<string, string>).route_b_id === toId,
  );
  if (!tc) return null;
  const r = tc.result as Record<string, number> | null;
  if (!r) return null;
  return {
    etaHours: r.eta_delta_hours ?? 0,
    fuelTons: r.fuel_delta_tons ?? 0,
    fuelUsd: r.fuel_delta_usd ?? 0,
    co2Tons: r.co2_delta_tons ?? 0,
  };
}

export function DecisionCard({ onAccept }: { onAccept: () => void }) {
  const phase = useBridgeStore((s) => s.phase);
  const decision = useBridgeStore((s) => s.agent.output);
  const toolCalls = useBridgeStore((s) => s.agent.toolCalls);
  const selectedRouteId = useBridgeStore((s) => s.agent.selectedRouteId);
  const selectRoute = useBridgeStore((s) => s.selectRoute);
  const activeRouteId = useBridgeStore((s) => s.activeRouteId);
  const scenario = useBridgeStore((s) => s.scenario);
  const dismiss = useBridgeStore((s) => s.dismiss);

  const visible = phase === "decision" && decision != null;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(visible));
    return () => cancelAnimationFrame(id);
  }, [visible]);

  if (!visible || !decision) return null;

  const routeMap = new Map<string, Route>(
    scenario.routes.map((r) => [r.id, r]),
  );
  const recommendedRoute = routeMap.get(decision.recommendedRouteId);
  const altARoute = routeMap.get(decision.alternativeRouteIds[0]);
  const altBRoute = routeMap.get(decision.alternativeRouteIds[1]);

  const recommendedDeltas =
    decision.recommendedRouteId === activeRouteId
      ? ZERO_DELTAS
      : (findCompareDeltas(
          toolCalls,
          activeRouteId,
          decision.recommendedRouteId,
        ) ?? {
          etaHours: decision.highlightDeltas.etaHours,
          fuelTons: decision.highlightDeltas.fuelTons,
          fuelUsd: decision.highlightDeltas.fuelUsd,
          co2Tons: decision.highlightDeltas.co2Tons,
        });

  const altADeltas =
    decision.alternativeRouteIds[0] === activeRouteId
      ? ZERO_DELTAS
      : (findCompareDeltas(
          toolCalls,
          activeRouteId,
          decision.alternativeRouteIds[0],
        ) ?? ZERO_DELTAS);

  const altBDeltas =
    decision.alternativeRouteIds[1] === activeRouteId
      ? ZERO_DELTAS
      : (findCompareDeltas(
          toolCalls,
          activeRouteId,
          decision.alternativeRouteIds[1],
        ) ?? ZERO_DELTAS);

  const selectedRoute = selectedRouteId
    ? routeMap.get(selectedRouteId)
    : undefined;

  return (
    <div
      className={`fixed sm:bottom-16 sm:right-6 sm:left-auto bottom-0 left-0 right-0 z-30 sm:w-[480px] max-h-[80vh] sm:max-h-none transition-all duration-300 ease-out ${
        mounted
          ? "translate-y-0 opacity-100"
          : "translate-y-4 opacity-0 pointer-events-none"
      }`}
    >
      <div className="rounded-t-xl sm:rounded-xl bg-slate-900/95 backdrop-blur-md border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[80vh] sm:max-h-none">
        <div className="px-5 pt-4 pb-3 border-b border-slate-800 flex items-center gap-2 shrink-0">
          <Compass className="size-4 text-emerald-400" />
          <span className="text-[10px] uppercase tracking-[0.15em] font-semibold text-emerald-300">
            Recommended Course
          </span>
        </div>

        <div className="overflow-y-auto flex-1 min-h-0">
        <div className="px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-100 leading-snug">
            {decision.headline}
          </h2>
        </div>

        <div className="mx-5 mb-4 space-y-2">
          {recommendedRoute && (
            <RouteOptionCard
              route={recommendedRoute}
              deltas={recommendedDeltas}
              showDeltas={decision.recommendedRouteId !== activeRouteId}
              isSelected={selectedRouteId === recommendedRoute.id}
              isAiSuggestion
              isCurrent={recommendedRoute.id === activeRouteId}
              onSelect={() => selectRoute(recommendedRoute.id)}
            />
          )}
          {altARoute && (
            <RouteOptionCard
              route={altARoute}
              deltas={altADeltas}
              showDeltas={decision.alternativeRouteIds[0] !== activeRouteId}
              isSelected={selectedRouteId === altARoute.id}
              isAiSuggestion={false}
              isCurrent={altARoute.id === activeRouteId}
              onSelect={() => selectRoute(altARoute.id)}
            />
          )}
          {altBRoute && (
            <RouteOptionCard
              route={altBRoute}
              deltas={altBDeltas}
              showDeltas={decision.alternativeRouteIds[1] !== activeRouteId}
              isSelected={selectedRouteId === altBRoute.id}
              isAiSuggestion={false}
              isCurrent={altBRoute.id === activeRouteId}
              onSelect={() => selectRoute(altBRoute.id)}
            />
          )}
        </div>

        <div className="px-5 pb-4">
          <p className="text-[14px] text-slate-200 leading-relaxed">
            “{decision.rationale}”
          </p>
        </div>

        <div className="px-5 pb-4 flex items-baseline gap-2 text-[11px] text-slate-500">
          <span className="uppercase tracking-[0.15em]">Sources</span>
          <span className="text-slate-400 truncate">
            {scenario.advisory.sources.map((s) => s.domain).join(" · ")}
          </span>
        </div>
        </div>

        <div className="px-5 py-3 bg-slate-950/40 border-t border-slate-800 flex items-center justify-end gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={dismiss}
            className="text-slate-300 hover:text-slate-100 hover:bg-slate-800"
          >
            Dismiss
          </Button>
          <Button
            size="sm"
            onClick={onAccept}
            disabled={!selectedRouteId}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold disabled:opacity-50 max-w-[70%] sm:max-w-none overflow-hidden"
          >
            <span className="truncate">
              Accept &amp; Log<span className="hidden sm:inline"> → {selectedRoute?.label ?? "…"}</span>
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}

function RouteOptionCard({
  route,
  deltas,
  showDeltas,
  isSelected,
  isAiSuggestion,
  isCurrent,
  onSelect,
}: {
  route: Route;
  deltas: RouteDeltas;
  showDeltas: boolean;
  isSelected: boolean;
  isAiSuggestion: boolean;
  isCurrent: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full text-left rounded-md border p-3 transition-all duration-150",
        isSelected
          ? "border-amber-400 bg-amber-950/40 ring-1 ring-amber-400/50"
          : "border-slate-600 bg-slate-800/40 hover:border-slate-400 hover:bg-slate-700/40 cursor-pointer",
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-white text-sm font-medium truncate">
          {route.label}
        </span>
        {isAiSuggestion && (
          <span className="text-[9px] text-emerald-400 uppercase tracking-widest font-semibold shrink-0">
            Suggested
          </span>
        )}
        {!isAiSuggestion && isCurrent && (
          <span className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold shrink-0">
            Current Route
          </span>
        )}
      </div>
      {showDeltas && (
        <div className="mt-1.5 flex items-center gap-3 text-[11px] tabular-nums">
          <span className={tone(deltas.etaHours)}>
            {fmtSigned(deltas.etaHours, "h")}
          </span>
          <span className="text-slate-700">·</span>
          <span className={tone(deltas.fuelUsd)}>
            {fmtUsdSigned(deltas.fuelUsd)}
          </span>
          <span className="text-slate-700">·</span>
          <span className={tone(deltas.co2Tons)}>
            {fmtSigned(deltas.co2Tons, "t CO₂")}
          </span>
        </div>
      )}
    </button>
  );
}
