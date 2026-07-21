import { create } from "zustand";
import type {
  Advisory,
  AgentStatus,
  AuditEntry,
  Decision,
  Scenario,
  ToolCall,
} from "./types";
import { SCENARIOS_BY_ID, DEFAULT_SCENARIO_ID } from "./scenarios";
import {
  buildWeatherRerouteScenario,
  attachWeatherRuntime,
} from "@/lib/weather/reroute";
import type {
  WeatherFetchResult,
  WeatherHazardZone,
  WeatherRouteAssessment,
  WeatherSourceStatus,
} from "@/lib/weather/types";

type Phase =
  | "idle"
  | "advisory"
  | "assessing"
  | "decision"
  | "accepted"
  | "dismissed";

interface State {
  scenarioId: string;
  scenario: Scenario;
  phase: Phase;
  activeRouteId: string;
  advisory: Advisory | null;
  weather: {
    status: WeatherSourceStatus;
    hazards: WeatherHazardZone[];
    assessment: WeatherRouteAssessment | null;
    message: string | null;
    lastUpdatedAt: string | null;
    autoRunKey: string | null;
  };
  agent: {
    status: AgentStatus;
    toolCalls: ToolCall[];
    output: Decision | null;
    error: string | null;
    selectedRouteId: string | null;
    rationaleDraft: string;
    rationaleFallbackMessage: string | null;
  };
  audit: AuditEntry[];
  customScenarios: Scenario[];
  complianceMode: boolean;
  vesselProgress: number;
  activeMaskZoneId: string | null;
  loadScenario: (id: string) => void;
  pushCustomScenario: (scenario: Scenario) => void;
  setComplianceMode: (active: boolean) => void;
  setVesselProgress: (t: number) => void;
  setActiveMaskZone: (zoneId: string | null) => void;
  setWeatherLoading: () => void;
  applyWeatherResult: (result: WeatherFetchResult) => void;
  triggerAdvisory: () => void;
  startAssess: () => void;
  pushToolCall: (t: ToolCall) => void;
  startAgentRationale: () => void;
  appendAgentRationale: (delta: string) => void;
  setAgentRationaleFallback: (rationale: string, message: string) => void;
  setAgentOutput: (o: Decision) => void;
  setAgentError: (e: string) => void;
  selectRoute: (routeId: string) => void;
  accept: () => void;
  dismiss: () => void;
  reset: () => void;
}

const initialAgent = () => ({
  status: "idle" as AgentStatus,
  toolCalls: [] as ToolCall[],
  output: null as Decision | null,
  error: null as string | null,
  selectedRouteId: null as string | null,
  rationaleDraft: "",
  rationaleFallbackMessage: null as string | null,
});

const initialWeather = () => ({
  status: "idle" as WeatherSourceStatus,
  hazards: [] as WeatherHazardZone[],
  assessment: null as WeatherRouteAssessment | null,
  message: null as string | null,
  lastUpdatedAt: null as string | null,
  autoRunKey: null as string | null,
});

const initial = (id: string, custom: Scenario[] = []) => {
  const s =
    SCENARIOS_BY_ID[id] ?? custom.find((c) => c.id === id);
  if (!s) throw new Error(`Unknown scenarioId: ${id}`);
  const currentRoute = s.routes.find((r) => r.isCurrent) ?? s.routes[0];
  return {
    scenarioId: id,
    scenario: s,
    activeRouteId: currentRoute.id,
  };
};

export const useBridgeStore = create<State>((set, get) => ({
  ...initial(DEFAULT_SCENARIO_ID),
  phase: "idle",
  advisory: null,
  weather: initialWeather(),
  agent: initialAgent(),
  audit: [],
  customScenarios: [],
  complianceMode: false,
  vesselProgress: 0,
  activeMaskZoneId: null,
  loadScenario: (id) => {
    const { customScenarios } = get();
    set({
      ...initial(id, customScenarios),
      phase: "idle",
      advisory: null,
      weather: initialWeather(),
      agent: initialAgent(),
      complianceMode: false,
      vesselProgress: 0,
      activeMaskZoneId: null,
    });
  },
  pushCustomScenario: (scenario) => {
    const currentRoute =
      scenario.routes.find((r) => r.isCurrent) ?? scenario.routes[0];
    set((s) => ({
      customScenarios: [...s.customScenarios, scenario],
      scenarioId: scenario.id,
      scenario,
      activeRouteId: currentRoute.id,
      phase: "idle",
      advisory: null,
      weather: initialWeather(),
      agent: initialAgent(),
      complianceMode: false,
      vesselProgress: 0,
      activeMaskZoneId: null,
    }));
  },
  setComplianceMode: (active) => set({ complianceMode: active }),
  setVesselProgress: (t) =>
    set({ vesselProgress: Math.max(0, Math.min(1, t)) }),
  setActiveMaskZone: (zoneId) => set({ activeMaskZoneId: zoneId }),
  setWeatherLoading: () =>
    set((s) => ({
      weather: { ...s.weather, status: "loading", message: null },
    })),
  applyWeatherResult: (result) =>
    set((s) => {
      const plan = buildWeatherRerouteScenario({
        scenario: s.scenario,
        activeRouteId: s.activeRouteId,
        hazards: result.hazards,
        source: result.status,
      });
      const severeWeather =
        plan.assessment.hazardous && plan.assessment.maxSeverity >= 3;
      const hazardKey = severeWeather
        ? [
            plan.scenario.id,
            plan.assessment.hazardousRouteId,
            plan.assessment.recommendedRouteId,
            plan.assessment.intersectingHazards.map((h) => h.id).join("|"),
          ].join(":")
        : null;
      const shouldRaiseWeatherAdvisory =
        severeWeather &&
        hazardKey !== s.weather.autoRunKey &&
        (s.phase === "idle" || s.phase === "advisory");
      const nextScenario = severeWeather
        ? plan.scenario
        : attachWeatherRuntime(s.scenario, result.hazards, plan.assessment);
      const customScenarios = s.customScenarios.some(
        (scenario) => scenario.id === nextScenario.id,
      )
        ? s.customScenarios.map((scenario) =>
            scenario.id === nextScenario.id ? nextScenario : scenario,
          )
        : s.customScenarios;

      return {
        scenario: nextScenario,
        customScenarios,
        phase: shouldRaiseWeatherAdvisory ? "advisory" : s.phase,
        advisory: shouldRaiseWeatherAdvisory
          ? nextScenario.advisory
          : s.advisory,
        weather: {
          status: result.status,
          hazards: result.hazards,
          assessment: plan.assessment,
          message: result.message ?? null,
          lastUpdatedAt: result.updatedAt,
          autoRunKey: shouldRaiseWeatherAdvisory
            ? hazardKey
            : s.weather.autoRunKey,
        },
      };
    }),
  triggerAdvisory: () =>
    set((s) => ({ phase: "advisory", advisory: s.scenario.advisory })),
  startAssess: () =>
    set({
      phase: "assessing",
      agent: {
        status: "thinking",
        toolCalls: [],
        output: null,
        error: null,
        selectedRouteId: null,
        rationaleDraft: "",
        rationaleFallbackMessage: null,
      },
    }),
  pushToolCall: (t) =>
    set((s) => ({
      agent: { ...s.agent, toolCalls: [...s.agent.toolCalls, t] },
    })),
  startAgentRationale: () =>
    set((s) => ({
      agent: {
        ...s.agent,
        status: "writing",
        rationaleDraft: "",
        rationaleFallbackMessage: null,
      },
    })),
  appendAgentRationale: (delta) =>
    set((s) => ({
      agent: {
        ...s.agent,
        rationaleDraft: `${s.agent.rationaleDraft}${delta}`,
      },
    })),
  setAgentRationaleFallback: (rationale, message) =>
    set((s) => ({
      agent: {
        ...s.agent,
        status: "writing",
        rationaleDraft: rationale,
        rationaleFallbackMessage: message,
      },
    })),
  setAgentOutput: (output) =>
    set((s) => ({
      phase: "decision",
      agent: {
        ...s.agent,
        status: "done",
        output,
        selectedRouteId: output.recommendedRouteId,
        rationaleDraft: output.rationale,
      },
    })),
  setAgentError: (error) =>
    set((s) => ({ agent: { ...s.agent, status: "error", error } })),
  selectRoute: (routeId) =>
    set((s) => ({ agent: { ...s.agent, selectedRouteId: routeId } })),
  accept: () => {
    const { agent, activeRouteId, scenarioId, scenario } = get();
    if (!agent.output) return;
    const routeToAccept =
      agent.selectedRouteId ?? agent.output.recommendedRouteId;
    const acceptedRoute = scenario.routes.find((r) => r.id === routeToAccept);
    const entry: AuditEntry = {
      id: `audit-${Date.now()}`,
      decidedAt: new Date().toISOString(),
      action: "accept",
      scenarioId,
      vesselId: scenario.vessel.id,
      fromRouteId: activeRouteId,
      toRouteId: routeToAccept,
      acceptedRouteId: routeToAccept,
      acceptedRouteLabel: acceptedRoute?.label ?? routeToAccept,
      wasRecommended: routeToAccept === agent.output.recommendedRouteId,
      rationale: agent.output.rationale,
      toolCallTrace: agent.toolCalls,
      recommendedRouteId: agent.output.recommendedRouteId,
    };
    set((s) => ({
      phase: "accepted",
      activeRouteId: routeToAccept,
      agent: { ...s.agent, selectedRouteId: null },
      audit: [entry, ...s.audit],
      complianceMode: true,
      vesselProgress: 0,
      activeMaskZoneId: null,
    }));
  },
  dismiss: () => {
    const { agent, activeRouteId, scenarioId, scenario } = get();
    const entry: AuditEntry = {
      id: `audit-${Date.now()}`,
      decidedAt: new Date().toISOString(),
      action: "dismiss",
      scenarioId,
      vesselId: scenario.vessel.id,
      fromRouteId: activeRouteId,
      toRouteId: null,
      acceptedRouteId: null,
      acceptedRouteLabel: null,
      wasRecommended: false,
      rationale: agent.output?.rationale ?? "(no assessment)",
      toolCallTrace: agent.toolCalls,
      recommendedRouteId: agent.output?.recommendedRouteId ?? null,
    };
    set((s) => ({
      phase: "dismissed",
      agent: { ...s.agent, selectedRouteId: null },
      audit: [entry, ...s.audit],
    }));
  },
  reset: () => {
    const { scenarioId, customScenarios } = get();
    set({
      ...initial(scenarioId, customScenarios),
      phase: "idle",
      advisory: null,
      weather: initialWeather(),
      agent: initialAgent(),
      complianceMode: false,
      vesselProgress: 0,
      activeMaskZoneId: null,
    });
  },
}));
