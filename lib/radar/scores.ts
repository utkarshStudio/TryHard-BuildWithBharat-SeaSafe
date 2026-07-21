import type { Scenario, ToolCall } from "@/lib/types";

export interface RouteRadarScores {
  routeId: string;
  label: string;
  scores: [number, number, number, number, number];
}

export const RADAR_AXES = [
  "RISK",
  "SPEED",
  "COST",
  "CARBON",
  "RELIABILITY",
] as const;

function normalise(values: number[], invert: boolean): number[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return values.map(() => 0.5);
  return values.map((v) => {
    const raw = invert ? (max - v) / (max - min) : (v - min) / (max - min);
    return raw;
  });
}

interface ChokepointResult {
  severity?: number;
}

interface RouteMetricsResult {
  route_id?: string;
  eta_hours?: number;
  fuel_cost_usd?: number;
  co2_tons?: number;
}

export function computeRadarScores(
  scenario: Scenario,
  toolCallTrace: ToolCall[],
): RouteRadarScores[] {
  const chokepointCall = toolCallTrace.find(
    (t) => t.name === "check_chokepoint_status",
  );
  const severity =
    (chokepointCall?.result as ChokepointResult | undefined)?.severity ?? 3;

  const routes = scenario.routes;
  const metricsMap: Record<string, RouteMetricsResult> = {};
  for (const call of toolCallTrace) {
    if (call.name === "calculate_route_metrics") {
      const res = call.result as RouteMetricsResult;
      if (res?.route_id) metricsMap[res.route_id] = res;
    }
  }

  const etas = routes.map(
    (r) => metricsMap[r.id]?.eta_hours ?? r.etaHours,
  );
  const costs = routes.map((r) => metricsMap[r.id]?.fuel_cost_usd ?? 0);
  const co2s = routes.map((r) => metricsMap[r.id]?.co2_tons ?? 0);

  const decision = scenario.decision;
  const riskValues = routes.map((r) => {
    if (r.id === decision.recommendedRouteId) return Math.max(1, severity - 2);
    if (r.id === decision.alternativeRouteIds[0]) return Math.max(1, severity - 1);
    return severity;
  });

  const maxEta = Math.max(...etas);
  const reliabilities = routes.map((_r, i) => {
    const etaFraction = maxEta > 0 ? etas[i] / maxEta : 0;
    const riskFraction = riskValues[i] / 5;
    return (1 - riskFraction) * 0.6 + (1 - etaFraction) * 0.4;
  });

  const normRisk = normalise(riskValues, false);
  const normSpeed = normalise(etas, true);
  const normCost = normalise(costs, false);
  const normCarbon = normalise(co2s, false);
  const normReliability = normalise(reliabilities, false);

  return routes.map((r, i) => ({
    routeId: r.id,
    label: r.label,
    scores: [
      normRisk[i],
      normSpeed[i],
      normCost[i],
      normCarbon[i],
      normReliability[i],
    ],
  }));
}
