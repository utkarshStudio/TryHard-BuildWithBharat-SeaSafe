import type { PortCongestionResult, Scenario } from "@/lib/types";
import type { WeatherHazardZone } from "@/lib/weather/types";
import { detectRouteHazards } from "@/lib/weather/routeHazardDetection";
import {
  FUEL_BURN_TONS_PER_DAY,
  BUNKER_PRICE_USD_PER_TON,
  CO2_TONS_PER_FUEL_TON,
} from "./constants";

export type ToolName =
  | "check_weather_hazards"
  | "check_chokepoint_status"
  | "calculate_route_metrics"
  | "compare_routes"
  | "check_port_congestion";

function calcRouteMetrics(scenario: Scenario, route_id: string) {
  const r = scenario.routes.find((x) => x.id === route_id);
  if (!r) {
    throw new Error(`Unknown route in scenario ${scenario.id}: ${route_id}`);
  }
  const days = r.etaHours / 24;
  const fuel_burn_tons = Math.round(days * FUEL_BURN_TONS_PER_DAY);
  const fuel_cost_usd = Math.round(fuel_burn_tons * BUNKER_PRICE_USD_PER_TON);
  const co2_tons = Math.round(fuel_burn_tons * CO2_TONS_PER_FUEL_TON);
  return {
    route_id,
    distance_nm: r.distanceNm,
    eta_hours: r.etaHours,
    fuel_burn_tons,
    fuel_cost_usd,
    co2_tons,
  };
}

function checkChokepoint(scenario: Scenario, chokepoint_id: string) {
  const cp = scenario.chokepoint;
  if (cp.id !== chokepoint_id) {
    throw new Error(
      `Unknown chokepoint in scenario ${scenario.id}: ${chokepoint_id}`,
    );
  }
  return {
    chokepoint_id,
    severity: cp.severity,
    status: cp.status,
    summary: cp.summary,
    ...(cp.transitDelayHours
      ? { transit_delay_hours: cp.transitDelayHours }
      : {}),
  };
}

function checkWeatherHazards(scenario: Scenario) {
  const hazards = scenario.weatherHazards ?? [];
  const currentRoute =
    scenario.routes.find((route) => route.isCurrent) ?? scenario.routes[0];
  const computed = detectRouteHazards(currentRoute, hazards);
  const assessment = scenario.weatherAssessment;
  const intersecting = assessment?.intersectingHazards ?? computed.intersectingHazards;
  const maxSeverity = assessment?.maxSeverity ?? computed.maxSeverity;

  return {
    hazardous: assessment?.hazardous ?? computed.hazardous,
    hazards: intersecting.map(summarizeWeatherHazard),
    recommendation:
      assessment?.recommendation ??
      (computed.hazardous
        ? "Weather hazard intersects active route. Review deterministic deviation."
        : "No severity-3+ live weather hazard intersects the active route."),
    projectedImpactHours: assessment?.projectedImpactHours ?? 0,
    maxSeverity,
    hazardousRouteId: assessment?.hazardousRouteId ?? currentRoute?.id,
    recommendedRouteId: assessment?.recommendedRouteId,
    source: assessment?.source ?? (hazards.length > 0 ? "live" : "idle"),
  };
}

function summarizeWeatherHazard(hazard: WeatherHazardZone) {
  return {
    id: hazard.id,
    type: hazard.type,
    severity: hazard.severity,
    label: hazard.label,
    center: hazard.center,
    movement: hazard.movement,
    metadata: hazard.metadata,
    updatedAt: hazard.updatedAt,
  };
}

function compareRoutes(
  scenario: Scenario,
  route_a_id: string,
  route_b_id: string,
) {
  const a = calcRouteMetrics(scenario, route_a_id);
  const b = calcRouteMetrics(scenario, route_b_id);
  return {
    distance_delta_nm: b.distance_nm - a.distance_nm,
    distance_delta_pct: Math.round(
      ((b.distance_nm - a.distance_nm) / a.distance_nm) * 100,
    ),
    eta_delta_hours: b.eta_hours - a.eta_hours,
    fuel_delta_tons: b.fuel_burn_tons - a.fuel_burn_tons,
    fuel_delta_usd: b.fuel_cost_usd - a.fuel_cost_usd,
    co2_delta_tons: b.co2_tons - a.co2_tons,
  };
}

export function check_port_congestion(
  portId: string,
  scenario: Scenario,
): PortCongestionResult {
  const data = scenario.portCongestion;
  if (!data || data.portId !== portId) {
    throw new Error(
      `No port congestion data for portId "${portId}" in scenario "${scenario.id}"`,
    );
  }
  return {
    portId: data.portId,
    portName: data.portName,
    unlocode: data.unlocode,
    berthOccupancyPct: data.berthOccupancyPct,
    anchorQueueVessels: data.anchorQueueVessels,
    estimatedWaitHours: data.estimatedWaitHours,
    status: data.status,
    note: data.note,
  };
}

export function runTool(
  scenario: Scenario,
  name: ToolName,
  args: Record<string, string>,
): unknown {
  switch (name) {
    case "check_weather_hazards":
      return checkWeatherHazards(scenario);
    case "check_chokepoint_status":
      return checkChokepoint(scenario, args.chokepoint_id);
    case "calculate_route_metrics":
      return calcRouteMetrics(scenario, args.route_id);
    case "compare_routes":
      return compareRoutes(scenario, args.route_a_id, args.route_b_id);
    case "check_port_congestion":
      return check_port_congestion(args.port_id, scenario);
    default:
      throw new Error(`Unknown tool: ${name as string}`);
  }
}
