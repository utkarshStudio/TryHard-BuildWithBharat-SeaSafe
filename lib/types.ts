import type {
  WeatherHazardZone,
  WeatherRouteAssessment,
} from "@/lib/weather/types";

export interface Vessel {
  id: string;
  name: string;
  imo: string;
  type: string;
  position: [number, number];
  headingDeg: number;
  cargoManifest: { item: string; tons: number }[];
}

export interface Port {
  id: string;
  name: string;
  country: string;
  position: [number, number];
  unlocode: string;
}

export interface Route {
  id: string;
  label: string;
  waypoints: [number, number][];
  etaHours: number;
  distanceNm: number;
  isCurrent?: boolean;
}

export interface Chokepoint {
  id: string;
  name: string;
  position: [number, number];
  polygon: [number, number][];
  severity: 1 | 2 | 3 | 4 | 5;
  status: string;
  summary: string;
  transitDelayHours?: number;
}

export interface Source {
  title: string;
  url: string;
  domain: string;
}

export interface Advisory {
  id: string;
  chokepointId: string;
  title: string;
  severity: 1 | 2 | 3 | 4 | 5;
  summary: string;
  sources: Source[];
}

export interface OrchestratorStep {
  tool:
    | "check_weather_hazards"
    | "check_chokepoint_status"
    | "calculate_route_metrics"
    | "compare_routes"
    | "check_port_congestion";
  args: Record<string, string>;
  delayMsBefore: number;
}

export interface PortCongestionResult {
  portId: string;
  portName: string;
  unlocode: string;
  berthOccupancyPct: number;
  anchorQueueVessels: number;
  estimatedWaitHours: number;
  status: "clear" | "moderate" | "congested" | "critical";
  note: string;
}

export interface Decision {
  recommendedRouteId: string;
  alternativeRouteIds: [string, string];
  headline: string;
  rationale: string;
  highlightDeltas: {
    etaHours: number;
    fuelTons: number;
    fuelUsd: number;
    co2Tons: number;
  };
}

export interface Scenario {
  id: string;
  label: string;
  flavor: string;
  vessel: Vessel;
  voyage: { from: Port; to: Port };
  routes: Route[];
  chokepoint: Chokepoint;
  advisory: Advisory;
  orchestratorScript: OrchestratorStep[];
  decision: Decision;
  portCongestion?: PortCongestionResult;
  weatherHazards?: WeatherHazardZone[];
  weatherAssessment?: WeatherRouteAssessment;
  isCustom?: boolean;
  customThreatZoneIds?: string[];
  complianceProfileIds?: string[];
  cameraOverride?: { longitude: number; latitude: number; zoom: number };
}

export interface ToolCall {
  name: string;
  args: Record<string, unknown>;
  result: unknown;
  durationMs: number;
}

export type AgentStatus = "idle" | "thinking" | "writing" | "done" | "error";

export interface AuditEntry {
  id: string;
  decidedAt: string;
  action: "accept" | "dismiss";
  scenarioId: string;
  vesselId: string;
  fromRouteId: string;
  toRouteId: string | null;
  acceptedRouteId: string | null;
  acceptedRouteLabel: string | null;
  wasRecommended: boolean;
  rationale: string;
  toolCallTrace: ToolCall[];
  recommendedRouteId: string | null;
}
