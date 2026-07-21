import type {
  Advisory,
  Chokepoint,
  Decision,
  OrchestratorStep,
  PortCongestionResult,
  Route,
  Scenario,
  Vessel,
} from "@/lib/types";
import { CHOKEPOINT_META } from "@/lib/routeLookup";
import { DANGER_ZONES_BY_ID } from "@/lib/dangerZones";
import { planCustomRoute } from "@/lib/customRoutePlanner";
import { findComplianceZones } from "@/lib/compliance/zones";
import {
  BUNKER_PRICE_USD_PER_TON,
  CO2_TONS_PER_FUEL_TON,
  FUEL_BURN_TONS_PER_DAY,
} from "@/lib/tools/constants";

export type VesselTypeKey =
  | "container"
  | "tanker"
  | "bulk"
  | "roro"
  | "general_cargo";

export interface CustomScenarioInput {
  vesselName: string;
  vesselType: VesselTypeKey;
  origin: string;
  destination: string;
  severity: 1 | 2 | 3 | 4 | 5;
}

const VESSEL_IMO: Record<VesselTypeKey, string> = {
  container: "9900001",
  tanker: "9900002",
  bulk: "9900003",
  roro: "9900004",
  general_cargo: "9900005",
};

const VESSEL_DESC: Record<VesselTypeKey, string> = {
  container: "Container · 10,000 TEU",
  tanker: "VLCC · 300,000 DWT Tanker",
  bulk: "Capesize · 180,000 DWT Bulk",
  roro: "RoRo · 8,000 Lane-Metre",
  general_cargo: "General Cargo · 15,000 DWT",
};

const VESSEL_CARGO: Record<VesselTypeKey, { item: string; tons: number }[]> = {
  container: [
    { item: "Mixed containerised cargo", tons: 38000 },
    { item: "Refrigerated goods", tons: 4200 },
  ],
  tanker: [{ item: "Crude oil (ballast)", tons: 0 }],
  bulk: [{ item: "Iron ore", tons: 175000 }],
  roro: [{ item: "Vehicles", tons: 12000 }],
  general_cargo: [
    { item: "Project cargo", tons: 9500 },
    { item: "Steel coils", tons: 4200 },
  ],
};

function metricsFromHours(hours: number) {
  const days = hours / 24;
  const fuelTons = Math.round(days * FUEL_BURN_TONS_PER_DAY);
  const fuelUsd = Math.round(fuelTons * BUNKER_PRICE_USD_PER_TON);
  const co2Tons = Math.round(fuelTons * CO2_TONS_PER_FUEL_TON);
  return { fuelTons, fuelUsd, co2Tons };
}

function complianceZonesForRoutes(routes: Route[]) {
  const zoneIds = new Set<string>();
  for (const route of routes) {
    for (const waypoint of route.waypoints) {
      findComplianceZones(waypoint[0], waypoint[1]).forEach((zone) =>
        zoneIds.add(zone.id),
      );
    }
  }
  return [...zoneIds];
}

export function buildCustomScenario(input: CustomScenarioInput): Scenario {
  const plan = planCustomRoute(input.origin, input.destination);
  const meta = CHOKEPOINT_META[plan.chokepointId];
  if (!meta) throw new Error(`Unknown chokepoint: ${plan.chokepointId}`);
  const hasThreats = plan.hazardIds.length > 0;
  const threatSummary = hasThreats
    ? `Detected mapped threats along the direct route: ${plan.threatLabel}. Safe alternate avoids all detected threat corridors.`
    : meta.statusTemplate(input.severity);

  const directM = metricsFromHours(plan.directRoute.etaHours);
  const safeM = metricsFromHours(plan.safeRoute.etaHours);

  const directRoute: Route = {
    id: plan.directRoute.id,
    label: plan.directRoute.label,
    isCurrent: true,
    distanceNm: plan.directRoute.distanceNm,
    etaHours: plan.directRoute.etaHours,
    waypoints: plan.directRoute.waypoints,
  };

  const safeRoute: Route = {
    id: plan.safeRoute.id,
    label: plan.safeRoute.label,
    isCurrent: false,
    distanceNm: plan.safeRoute.distanceNm,
    etaHours: plan.safeRoute.etaHours,
    waypoints: plan.safeRoute.waypoints,
  };

  const midDistanceNm = Math.round(
    (directRoute.distanceNm + safeRoute.distanceNm) / 2,
  );
  const midEtaHours = Math.round(
    (directRoute.etaHours + safeRoute.etaHours) / 2 +
      meta.transitDelayHours(input.severity) * 0.5,
  );

  const midRoute: Route = {
    id: `${directRoute.id}-escorted`,
    label: `${directRoute.label} (escorted transit)`,
    isCurrent: false,
    distanceNm: midDistanceNm,
    etaHours: midEtaHours,
    waypoints: directRoute.waypoints,
  };

  const decision: Decision = {
    recommendedRouteId: safeRoute.id,
    alternativeRouteIds: [midRoute.id, directRoute.id],
    headline: hasThreats
      ? `Divert via ${safeRoute.label}`
      : `Proceed via ${directRoute.label}`,
    rationale: hasThreats
      ? `${threatSummary} Safe alternate adds ${Math.abs(safeRoute.etaHours - directRoute.etaHours)} h and $${Math.abs(
          safeM.fuelUsd - directM.fuelUsd,
        ).toLocaleString()} in fuel against severity-${input.severity} threat conditions. Diversion recommended.`
      : `${threatSummary} The computed route has no mapped high-risk corridor on this model; continue standard monitoring.`,
    highlightDeltas: {
      etaHours: safeRoute.etaHours - directRoute.etaHours,
      fuelTons: safeM.fuelTons - directM.fuelTons,
      fuelUsd: safeM.fuelUsd - directM.fuelUsd,
      co2Tons: safeM.co2Tons - directM.co2Tons,
    },
  };

  // Use the first default zone polygon as the chokepoint's representative polygon
  const primaryZone =
    DANGER_ZONES_BY_ID[meta.defaultZoneIds[0]] ?? DANGER_ZONES_BY_ID[meta.defaultZoneIds[0] ?? ""];
  const chokepoint: Chokepoint = {
    id: meta.id,
    name: meta.label,
    position: primaryZone
      ? [
          (primaryZone.polygon[0][0] + primaryZone.polygon[2][0]) / 2,
          (primaryZone.polygon[0][1] + primaryZone.polygon[2][1]) / 2,
        ]
      : [
          plan.cameraOverride.longitude,
          plan.cameraOverride.latitude,
        ],
    polygon: primaryZone?.polygon ?? [
      [plan.cameraOverride.longitude - 1, plan.cameraOverride.latitude - 1],
      [plan.cameraOverride.longitude + 1, plan.cameraOverride.latitude - 1],
      [plan.cameraOverride.longitude + 1, plan.cameraOverride.latitude + 1],
      [plan.cameraOverride.longitude - 1, plan.cameraOverride.latitude + 1],
    ],
    severity: input.severity,
    status: hasThreats ? "active_threat" : "clear",
    summary: threatSummary,
    transitDelayHours: meta.transitDelayHours(input.severity),
  };

  const advisory: Advisory = {
    id: `custom-adv-${Date.now()}`,
    chokepointId: meta.id,
    title: hasThreats
      ? plan.hazardIds.length > 1
        ? "Multi-threat route advisory"
        : meta.label
      : meta.label,
    severity: input.severity,
    summary: threatSummary,
    sources: [
      {
        title: `${meta.region} situational advisory`,
        url: "https://www.maritime-executive.com/",
        domain: "maritime-executive.com",
      },
      {
        title: `${meta.label} routing brief`,
        url: "https://lloydslist.com/",
        domain: "lloydslist.com",
      },
    ],
  };

  const portId = plan.destination.port.id;
  const portCongestion: PortCongestionResult = {
    portId,
    portName: plan.destination.port.name,
    unlocode: plan.destination.port.unlocode,
    berthOccupancyPct: Math.min(95, 45 + input.severity * 8),
    anchorQueueVessels: input.severity * 2,
    estimatedWaitHours: input.severity * 6,
    status:
      input.severity >= 4
        ? "congested"
        : input.severity >= 3
          ? "moderate"
          : "clear",
    note: `Estimated berth wait ${input.severity * 6} h based on current occupancy at ${plan.destination.port.name}.`,
  };

  const vessel: Vessel = {
    id: `custom-vessel-${Date.now()}`,
    name: input.vesselName,
    imo: VESSEL_IMO[input.vesselType],
    type: VESSEL_DESC[input.vesselType],
    position: plan.origin.port.position,
    headingDeg: 90,
    cargoManifest: VESSEL_CARGO[input.vesselType],
  };

  const orchestratorScript: OrchestratorStep[] = [
    {
      tool: "check_chokepoint_status",
      args: { chokepoint_id: meta.id },
      delayMsBefore: 700,
    },
    {
      tool: "calculate_route_metrics",
      args: { route_id: directRoute.id },
      delayMsBefore: 900,
    },
    {
      tool: "calculate_route_metrics",
      args: { route_id: safeRoute.id },
      delayMsBefore: 900,
    },
    {
      tool: "calculate_route_metrics",
      args: { route_id: midRoute.id },
      delayMsBefore: 900,
    },
    {
      tool: "compare_routes",
      args: { route_a_id: directRoute.id, route_b_id: safeRoute.id },
      delayMsBefore: 700,
    },
    {
      tool: "compare_routes",
      args: { route_a_id: directRoute.id, route_b_id: midRoute.id },
      delayMsBefore: 700,
    },
    {
      tool: "check_port_congestion",
      args: { port_id: portId },
      delayMsBefore: 700,
    },
  ];

  return {
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    label: `${input.vesselName} — ${plan.origin.input} to ${plan.destination.input}`,
    flavor: `${hasThreats ? plan.threatLabel : meta.label} · severity ${input.severity}`,
    vessel,
    voyage: {
      from: {
        id: plan.origin.port.id,
        name: plan.origin.name,
        country: plan.origin.country,
        unlocode: plan.origin.port.unlocode,
        position: plan.origin.port.position,
      },
      to: {
        id: portId,
        name: plan.destination.name,
        country: plan.destination.country,
        unlocode: plan.destination.port.unlocode,
        position: plan.destination.port.position,
      },
    },
    routes: [directRoute, safeRoute, midRoute],
    chokepoint,
    advisory,
    orchestratorScript,
    decision,
    portCongestion,
    isCustom: true,
    customThreatZoneIds: plan.hazardZoneIds,
    complianceProfileIds: complianceZonesForRoutes([
      directRoute,
      safeRoute,
      midRoute,
    ]),
    cameraOverride: {
      longitude: plan.cameraOverride.longitude,
      latitude: plan.cameraOverride.latitude,
      zoom: plan.cameraOverride.zoom,
    },
  };
}
