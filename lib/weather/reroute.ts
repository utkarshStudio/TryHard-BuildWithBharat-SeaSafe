import type {
  Advisory,
  Decision,
  OrchestratorStep,
  Route,
  Scenario,
} from "@/lib/types";
import {
  BUNKER_PRICE_USD_PER_TON,
  CO2_TONS_PER_FUEL_TON,
  FUEL_BURN_TONS_PER_DAY,
  VESSEL_SPEED_KN,
} from "@/lib/tools/constants";
import type {
  WeatherHazardZone,
  WeatherRouteAssessment,
  WeatherSourceStatus,
} from "@/lib/weather/types";
import { detectRouteHazards } from "@/lib/weather/routeHazardDetection";

export interface WeatherReroutePlan {
  scenario: Scenario;
  assessment: WeatherRouteAssessment;
}

export function buildWeatherRerouteScenario({
  scenario,
  activeRouteId,
  hazards,
  source,
}: {
  scenario: Scenario;
  activeRouteId: string;
  hazards: WeatherHazardZone[];
  source: WeatherSourceStatus;
}): WeatherReroutePlan {
  const activeRoute =
    scenario.routes.find((route) => route.id === activeRouteId) ??
    scenario.routes.find((route) => route.isCurrent) ??
    scenario.routes[0];
  const detection = detectRouteHazards(activeRoute, hazards);
  const severeHazards = detection.intersectingHazards.filter(
    (hazard) => hazard.severity >= 3,
  );

  if (!activeRoute || severeHazards.length === 0) {
    const assessment = buildAssessment({
      hazardous: false,
      route: activeRoute,
      hazards: detection.intersectingHazards,
      maxSeverity: detection.maxSeverity,
      source,
    });
    return {
      scenario: attachWeatherRuntime(scenario, hazards, assessment),
      assessment,
    };
  }

  const safeRoute =
    chooseExistingSafeRoute(scenario.routes, activeRoute.id, hazards) ??
    createDeviationRoute(activeRoute, severeHazards[0]);
  const routes = upsertSafeRoute(scenario.routes, activeRoute.id, safeRoute);
  const comparison = routeDeltas(activeRoute, safeRoute);
  const alternateRouteIds = chooseAlternates(routes, activeRoute.id, safeRoute.id);
  const primaryHazard = severeHazards[0];
  const assessment = buildAssessment({
    hazardous: true,
    route: activeRoute,
    hazards: severeHazards,
    maxSeverity: detection.maxSeverity,
    recommendedRouteId: safeRoute.id,
    source,
  });
  const decision = weatherDecision(
    safeRoute,
    activeRoute,
    primaryHazard,
    alternateRouteIds,
    comparison,
  );
  const advisory = weatherAdvisory(scenario.advisory, primaryHazard, severeHazards);
  const orchestratorScript = weatherScript({
    scenario,
    activeRouteId: activeRoute.id,
    safeRouteId: safeRoute.id,
    alternateRouteIds,
  });

  const updatedScenario: Scenario = {
    ...scenario,
    routes,
    advisory,
    decision,
    orchestratorScript,
    cameraOverride: scenario.cameraOverride ?? {
      longitude: primaryHazard.center[0],
      latitude: primaryHazard.center[1],
      zoom: primaryHazard.type === "cyclone" ? 4.2 : 4.6,
    },
  };

  return {
    scenario: attachWeatherRuntime(updatedScenario, hazards, assessment),
    assessment,
  };
}

export function attachWeatherRuntime(
  scenario: Scenario,
  hazards: WeatherHazardZone[],
  assessment: WeatherRouteAssessment,
): Scenario {
  return {
    ...scenario,
    weatherHazards: hazards,
    weatherAssessment: assessment,
  };
}

function chooseExistingSafeRoute(
  routes: Route[],
  activeRouteId: string,
  hazards: WeatherHazardZone[],
) {
  return routes
    .filter((route) => route.id !== activeRouteId)
    .map((route) => ({
      route,
      detection: detectRouteHazards(route, hazards),
    }))
    .filter(({ detection }) => !detection.hazardous || detection.maxSeverity < 3)
    .sort((a, b) => a.route.etaHours - b.route.etaHours)[0]?.route;
}

function createDeviationRoute(
  activeRoute: Route,
  hazard: WeatherHazardZone,
): Route {
  const points = activeRoute.waypoints;
  const center = hazard.center;
  const nearestIndex = nearestWaypointIndex(points, center);
  const before = points[Math.max(0, nearestIndex - 1)];
  const after = points[Math.min(points.length - 1, nearestIndex + 1)];
  const routeEastWest = Math.abs(after[0] - before[0]) >= Math.abs(after[1] - before[1]);
  const latBias = center[1] >= 0 ? -1 : 1;
  const lngBias = center[0] >= 0 ? -1 : 1;
  const severityOffset = 2.6 + hazard.severity * 0.55;

  const deviationA: [number, number] = routeEastWest
    ? [center[0] - 2.2, center[1] + latBias * severityOffset]
    : [center[0] + lngBias * severityOffset, center[1] - 2.2];
  const deviationB: [number, number] = routeEastWest
    ? [center[0] + 2.2, center[1] + latBias * severityOffset]
    : [center[0] + lngBias * severityOffset, center[1] + 2.2];

  const newWaypoints = [
    ...points.slice(0, Math.max(1, nearestIndex)),
    deviationA,
    deviationB,
    ...points.slice(Math.min(points.length - 1, nearestIndex + 1)),
  ];

  return routeFromPoints(
    `weather-safe-${activeRoute.id}`,
    "Weather deviation corridor",
    dedupePoints(newWaypoints),
  );
}

function upsertSafeRoute(routes: Route[], activeRouteId: string, safeRoute: Route): Route[] {
  const updatedActive = routes.map((route) => ({
    ...route,
    isCurrent: route.id === activeRouteId,
  }));
  const existing = updatedActive.some((route) => route.id === safeRoute.id);
  return existing
    ? updatedActive.map((route) =>
        route.id === safeRoute.id ? { ...safeRoute, isCurrent: false } : route,
      )
    : [...updatedActive, { ...safeRoute, isCurrent: false }];
}

function chooseAlternates(
  routes: Route[],
  activeRouteId: string,
  safeRouteId: string,
): [string, string] {
  const fallback =
    routes.find((route) => route.id !== activeRouteId && route.id !== safeRouteId)
      ?.id ?? activeRouteId;
  return [fallback, activeRouteId];
}

function weatherDecision(
  safeRoute: Route,
  activeRoute: Route,
  hazard: WeatherHazardZone,
  alternateRouteIds: [string, string],
  comparison: ReturnType<typeof routeDeltas>,
): Decision {
  const wind = hazard.metadata.windSpeedKts
    ? `${Math.round(hazard.metadata.windSpeedKts)} kt winds`
    : null;
  const wave = hazard.metadata.waveHeightM
    ? `${hazard.metadata.waveHeightM.toFixed(1)} m seas`
    : null;
  const pressure = hazard.metadata.pressureMb
    ? `${Math.round(hazard.metadata.pressureMb)} mb pressure`
    : null;
  const conditions = [wind, wave, pressure].filter(Boolean).join(", ");
  const exposure =
    conditions.length > 0 ? ` Current exposure includes ${conditions}.` : "";

  return {
    recommendedRouteId: safeRoute.id,
    alternativeRouteIds: alternateRouteIds,
    headline: `Divert around ${hazard.label}`,
    rationale: `${hazard.label} intersects ${activeRoute.label} within the active operating window.${exposure} ${safeRoute.label} adds ${Math.abs(
      comparison.etaHours,
    )} h but clears the modeled hazard polygon and keeps the captain in control of acceptance.`,
    highlightDeltas: comparison,
  };
}

function weatherAdvisory(
  current: Advisory,
  primary: WeatherHazardZone,
  hazards: WeatherHazardZone[],
): Advisory {
  const types = Array.from(new Set(hazards.map((hazard) => hazard.type))).join(" / ");
  return {
    ...current,
    id: `weather-${primary.id}`,
    title: primary.label,
    severity: primary.severity,
    summary: `${primary.label} intersects the active corridor. SeaSafe recommends weather deviation; detected hazards: ${types}.`,
    sources: [
      {
        title: "Open-Meteo live weather and marine forecast",
        url: "https://open-meteo.com/",
        domain: "open-meteo.com",
      },
      ...current.sources.slice(0, 2),
    ],
  };
}

function weatherScript({
  scenario,
  activeRouteId,
  safeRouteId,
  alternateRouteIds,
}: {
  scenario: Scenario;
  activeRouteId: string;
  safeRouteId: string;
  alternateRouteIds: [string, string];
}): OrchestratorStep[] {
  const base = scenario.orchestratorScript.filter(
    (step) => step.tool !== "check_weather_hazards",
  );
  const chokepoint = base.find((step) => step.tool === "check_chokepoint_status");
  const portCongestion = base.find((step) => step.tool === "check_port_congestion");
  const metricIds = Array.from(
    new Set([activeRouteId, safeRouteId, alternateRouteIds[0]].filter(Boolean)),
  );

  return [
    { tool: "check_weather_hazards", args: {}, delayMsBefore: 550 },
    chokepoint ?? {
      tool: "check_chokepoint_status",
      args: { chokepoint_id: scenario.chokepoint.id },
      delayMsBefore: 650,
    },
    ...metricIds.map((routeId) => ({
      tool: "calculate_route_metrics" as const,
      args: { route_id: routeId },
      delayMsBefore: 760,
    })),
    {
      tool: "compare_routes",
      args: { route_a_id: activeRouteId, route_b_id: safeRouteId },
      delayMsBefore: 620,
    },
    {
      tool: "compare_routes",
      args: { route_a_id: activeRouteId, route_b_id: alternateRouteIds[0] },
      delayMsBefore: 620,
    },
    ...(portCongestion ? [portCongestion] : []),
  ];
}

function buildAssessment({
  hazardous,
  route,
  hazards,
  maxSeverity,
  recommendedRouteId,
  source,
}: {
  hazardous: boolean;
  route?: Route;
  hazards: WeatherHazardZone[];
  maxSeverity: number;
  recommendedRouteId?: string;
  source: WeatherSourceStatus;
}): WeatherRouteAssessment {
  const primary = hazards[0];
  const projectedImpactHours = primary
    ? Math.max(6, 12 + primary.severity * 3)
    : 0;
  return {
    hazardous,
    intersectingHazards: hazards,
    maxSeverity,
    hazardousRouteId: hazardous ? route?.id : undefined,
    recommendedRouteId,
    projectedImpactHours,
    recommendation: hazardous
      ? `${primary?.label ?? "Weather hazard"} intersects ${route?.label ?? "active route"}. Recommend deterministic weather deviation.`
      : "No severity-3+ live weather hazard intersects the active route.",
    source,
    updatedAt: new Date().toISOString(),
  };
}

function routeDeltas(from: Route, to: Route) {
  const etaHours = to.etaHours - from.etaHours;
  const fuelTons = Math.round((etaHours / 24) * FUEL_BURN_TONS_PER_DAY);
  const fuelUsd = Math.round(fuelTons * BUNKER_PRICE_USD_PER_TON);
  const co2Tons = Math.round(fuelTons * CO2_TONS_PER_FUEL_TON);
  return { etaHours, fuelTons, fuelUsd, co2Tons };
}

function routeFromPoints(id: string, label: string, points: [number, number][]): Route {
  const distanceNm = Math.max(
    1,
    Math.round(
      points.slice(1).reduce((sum, point, index) => {
        return sum + haversineNm(points[index], point);
      }, 0),
    ),
  );
  return {
    id,
    label,
    waypoints: points,
    distanceNm,
    etaHours: Math.max(1, Math.round(distanceNm / VESSEL_SPEED_KN)),
    isCurrent: false,
  };
}

function nearestWaypointIndex(points: [number, number][], center: [number, number]) {
  return points.reduce((bestIndex, point, index) => {
    const best = distanceDeg(points[bestIndex], center);
    const next = distanceDeg(point, center);
    return next < best ? index : bestIndex;
  }, 0);
}

function dedupePoints(points: [number, number][]) {
  return points.filter(
    (point, index) =>
      index === 0 ||
      Math.abs(point[0] - points[index - 1][0]) > 0.01 ||
      Math.abs(point[1] - points[index - 1][1]) > 0.01,
  );
}

function haversineNm(a: [number, number], b: [number, number]) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthRadiusNm = 3440.065;
  const dLat = toRad(b[1] - a[1]);
  const dLon = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * earthRadiusNm * Math.asin(Math.min(1, Math.sqrt(h)));
}

function distanceDeg(a: [number, number], b: [number, number]) {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}
