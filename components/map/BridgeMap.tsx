"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import DeckGL from "@deck.gl/react";
import { FlyToInterpolator } from "@deck.gl/core";
import {
  PathLayer,
  PolygonLayer,
  ScatterplotLayer,
  TextLayer,
} from "@deck.gl/layers";
import { Map as MapGL } from "react-map-gl/maplibre";
import { useBridgeStore } from "@/lib/store";
import type { Port, Route } from "@/lib/types";
import { buildRouteLayer } from "./routeLayer";
import { buildRiskZoneLayer } from "./riskZoneLayer";
import {
  type DangerZone,
  getRelevantZonesForWaypoints,
} from "@/lib/dangerZones";
import {
  fetchWeatherHazards,
  WEATHER_POLL_INTERVAL_MS,
} from "@/lib/weather/weatherService";
import type {
  WeatherHazardType,
  WeatherHazardZone,
  WeatherViewportBounds,
} from "@/lib/weather/types";
import { CHOKEPOINT_META } from "@/lib/routeLookup";
import {
  bboxToPolygon,
  type ComplianceProfile,
  type ComplianceZone,
} from "@/lib/compliance/zones";
import {
  computeMaskedRoute,
  type MaskedRouteResult,
} from "@/lib/compliance/maskingEngine";
import { getScenarioComplianceProfile } from "@/lib/compliance/scenarioMasks";
import {
  buildVesselLayer,
  probeVesselIcon,
  type VesselIconStatus,
} from "./vesselLayer";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/positron";

const CAMERAS: Record<
  string,
  { longitude: number; latitude: number; zoom: number }
> = {
  "red-sea": { longitude: 50, latitude: 15, zoom: 2.2 },
  hormuz: { longitude: 70, latitude: 15, zoom: 3 },
  panama: { longitude: -45, latitude: 24, zoom: 1.8 },
  malacca: { longitude: 95, latitude: 8, zoom: 3 },
  cyclone: { longitude: 75.5, latitude: 12.8, zoom: 4.4 },
};

const ROUTE_GREEN: [number, number, number, number] = [16, 185, 129, 230];
const ROUTE_BLUE: [number, number, number, number] = [99, 179, 237, 160];
const ROUTE_RED_MUTED: [number, number, number, number] = [239, 68, 68, 120];
const ROUTE_RED: [number, number, number, number] = [239, 68, 68, 190];
const WEATHER_SAFE_GREEN: [number, number, number, number] = [45, 212, 191, 190];
const WEATHER_ROUTE_RED: [number, number, number, number] = [248, 113, 113, 210];

const SWAP_DURATION_MS = 800;

const COMPLIANCE_OVERLAY_COLORS: Record<
  Exclude<ComplianceProfile, "international_imo">,
  {
    fill: [number, number, number, number];
    line: [number, number, number, number];
  }
> = {
  india_dpdp: {
    fill: [249, 115, 22, 20],
    line: [249, 115, 22, 100],
  },
  eu_gdpr: {
    fill: [59, 130, 246, 20],
    line: [59, 130, 246, 100],
  },
  gulf_uae_fdpl: {
    fill: [234, 179, 8, 20],
    line: [234, 179, 8, 100],
  },
};

type ViewState = {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
  transitionDuration?: number;
  transitionInterpolator?: FlyToInterpolator;
};

const cameraFor = (
  id: string,
  override?: { longitude: number; latitude: number; zoom: number },
): ViewState => {
  const c =
    override ?? CAMERAS[id] ?? { longitude: 0, latitude: 20, zoom: 1.5 };
  return { ...c, pitch: 0, bearing: 0 };
};

const flyTo = (
  id: string,
  override?: { longitude: number; latitude: number; zoom: number },
  speed = 1.4,
): ViewState => ({
  ...cameraFor(id, override),
  transitionDuration: 1500,
  transitionInterpolator: new FlyToInterpolator({ speed }),
});

const dimColor = (
  base: [number, number, number, number],
  dim: boolean,
): [number, number, number, number] =>
  dim
    ? [base[0], base[1], base[2], Math.round(base[3] * 0.4)]
    : base;

const withOpacity = (
  base: [number, number, number, number],
  opacity: number,
): [number, number, number, number] => [
  base[0],
  base[1],
  base[2],
  Math.round(base[3] * opacity),
];

const customRouteColor = (
  route: Route,
  routes: Route[],
): [number, number, number, number] => {
  if (route.id === routes[0]?.id) return ROUTE_RED;
  if (route.id === routes[1]?.id) return ROUTE_GREEN;
  return ROUTE_BLUE;
};

type WeatherTrack = {
  id: string;
  type: WeatherHazardType;
  severity: number;
  critical: boolean;
  path: [number, number][];
};

const WEATHER_COLORS: Record<
  WeatherHazardType,
  {
    fill: [number, number, number];
    line: [number, number, number];
    track: [number, number, number];
  }
> = {
  cyclone: {
    fill: [126, 34, 206],
    line: [248, 113, 113],
    track: [216, 180, 254],
  },
  storm: {
    fill: [194, 65, 12],
    line: [251, 146, 60],
    track: [253, 186, 116],
  },
  rain: {
    fill: [30, 64, 175],
    line: [96, 165, 250],
    track: [147, 197, 253],
  },
  swell: {
    fill: [12, 74, 110],
    line: [34, 211, 238],
    track: [103, 232, 249],
  },
  wind: {
    fill: [161, 98, 7],
    line: [250, 204, 21],
    track: [253, 224, 71],
  },
};

function weatherOpacity(
  hazard: WeatherHazardZone,
  criticalHazardIds: Set<string>,
) {
  return criticalHazardIds.has(hazard.id) || hazard.severity >= 4 ? 1 : 0.4;
}

function weatherFillColor(
  hazard: WeatherHazardZone,
  criticalHazardIds: Set<string>,
  pulseTick: number,
): [number, number, number, number] {
  const color = WEATHER_COLORS[hazard.type].fill;
  const opacity = weatherOpacity(hazard, criticalHazardIds);
  const pulse =
    hazard.type === "cyclone" && opacity === 1
      ? 0.78 + Math.sin(pulseTick / 7) * 0.22
      : hazard.type === "rain"
        ? 0.68 + Math.sin(pulseTick / 9) * 0.2
      : 1;
  const baseAlpha =
    hazard.type === "rain"
      ? 48
      : hazard.type === "swell"
        ? 58
        : hazard.type === "cyclone"
          ? 70
          : 64;
  return [color[0], color[1], color[2], Math.round(baseAlpha * opacity * pulse)];
}

function weatherLineColor(
  hazard: WeatherHazardZone,
  criticalHazardIds: Set<string>,
): [number, number, number, number] {
  const color = WEATHER_COLORS[hazard.type].line;
  const opacity = weatherOpacity(hazard, criticalHazardIds);
  return [color[0], color[1], color[2], Math.round(210 * opacity)];
}

function weatherTrackColor(track: WeatherTrack): [number, number, number, number] {
  const color = WEATHER_COLORS[track.type].track;
  return [color[0], color[1], color[2], track.critical ? 180 : 72];
}

function weatherTracks(
  hazards: WeatherHazardZone[],
  criticalHazardIds: Set<string>,
): WeatherTrack[] {
  return hazards
    .filter((hazard) => hazard.movement)
    .map((hazard) => {
      const direction = ((hazard.movement?.directionDeg ?? 0) * Math.PI) / 180;
      const length = 0.9 + hazard.severity * 0.22;
      return {
        id: `${hazard.id}-track`,
        type: hazard.type,
        severity: hazard.severity,
        critical: criticalHazardIds.has(hazard.id),
        path: [
          hazard.center,
          [
            hazard.center[0] + Math.sin(direction) * length,
            hazard.center[1] + Math.cos(direction) * length,
          ],
        ],
      };
    });
}

function estimateViewportBounds(viewState: ViewState): WeatherViewportBounds {
  const lngSpan = Math.min(140, 360 / 2 ** Math.max(0.2, viewState.zoom) * 1.25);
  const latSpan = Math.min(80, lngSpan * 0.58);
  return {
    west: Math.max(-180, viewState.longitude - lngSpan / 2),
    east: Math.min(180, viewState.longitude + lngSpan / 2),
    south: Math.max(-85, viewState.latitude - latSpan / 2),
    north: Math.min(85, viewState.latitude + latSpan / 2),
  };
}

function weatherTooltip(zone: WeatherHazardZone) {
  const meta = [
    zone.metadata.windSpeedKts
      ? `${Math.round(zone.metadata.windSpeedKts)} kt wind`
      : null,
    zone.metadata.waveHeightM ? `${zone.metadata.waveHeightM.toFixed(1)} m sea` : null,
    zone.metadata.rainfallMm
      ? `${zone.metadata.rainfallMm.toFixed(1)} mm rain`
      : null,
    zone.metadata.pressureMb ? `${Math.round(zone.metadata.pressureMb)} mb` : null,
  ].filter(Boolean);

  return `<div style="font-family:Inter,sans-serif;font-size:11px;max-width:250px;line-height:1.5"><div style="font-weight:700;margin-bottom:4px;color:#f8fafc">${zone.label}</div><div style="color:#94a3b8">${meta.join(" · ") || "Live marine forecast signal"}</div><div style="margin-top:6px;color:#67e8f9;text-transform:uppercase;letter-spacing:0.08em;font-size:10px">Severity ${zone.severity} · ${zone.type.toUpperCase()} · ${new Date(zone.updatedAt).toLocaleTimeString()}</div></div>`;
}

export function BridgeMap() {
  const scenarioId = useBridgeStore((s) => s.scenarioId);
  const scenario = useBridgeStore((s) => s.scenario);
  const activeRouteId = useBridgeStore((s) => s.activeRouteId);
  const phase = useBridgeStore((s) => s.phase);
  const recommendedRouteId = useBridgeStore(
    (s) => s.agent.output?.recommendedRouteId,
  );
  const alternativeRouteIds = useBridgeStore(
    (s) => s.agent.output?.alternativeRouteIds,
  );
  const selectedRouteId = useBridgeStore((s) => s.agent.selectedRouteId);
  const complianceMode = useBridgeStore((s) => s.complianceMode);
  const vesselProgress = useBridgeStore((s) => s.vesselProgress);
  const weather = useBridgeStore((s) => s.weather);
  const setWeatherLoading = useBridgeStore((s) => s.setWeatherLoading);
  const applyWeatherResult = useBridgeStore((s) => s.applyWeatherResult);

  const cameraOverride = scenario?.cameraOverride;
  const [viewState, setViewState] = useState<ViewState>(() =>
    cameraFor(scenarioId, cameraOverride),
  );
  const [iconStatus, setIconStatus] = useState<VesselIconStatus>("loading");
  const [pulseTick, setPulseTick] = useState(0);
  const firstRender = useRef(true);

  const [fadingOutRouteId, setFadingOutRouteId] = useState<string | null>(null);
  const [fadeOpacity, setFadeOpacity] = useState(1);
  const [newRouteOpacity, setNewRouteOpacity] = useState(1);
  const prevActiveRef = useRef(activeRouteId);
  const scenarioRef = useRef(scenario);
  const viewStateRef = useRef(viewState);
  const focusedHazardRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    probeVesselIcon().then((ok) => {
      if (!cancelled) setIconStatus(ok ? "available" : "missing");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    scenarioRef.current = scenario;
  }, [scenario]);

  useEffect(() => {
    viewStateRef.current = viewState;
  }, [viewState]);

  useEffect(() => {
    let cancelled = false;
    let inflight = false;

    const pollWeather = async () => {
      const current = scenarioRef.current;
      if (!current || inflight) return;
      inflight = true;
      setWeatherLoading();
      try {
        const result = await fetchWeatherHazards({
          scenarioId: current.id,
          routes: current.routes,
          activeRouteId,
          chokepoint: current.chokepoint,
          viewportBounds: estimateViewportBounds(viewStateRef.current),
        });
        if (!cancelled) applyWeatherResult(result);
      } catch {
        if (!cancelled) {
          applyWeatherResult({
            hazards: [],
            status: "unavailable",
            message: "Live weather temporarily unavailable.",
            updatedAt: new Date().toISOString(),
          });
        }
      } finally {
        inflight = false;
      }
    };

    void pollWeather();
    const timer = setInterval(pollWeather, WEATHER_POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [activeRouteId, scenarioId, setWeatherLoading, applyWeatherResult]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      setViewState(cameraFor(scenarioId, cameraOverride));
      return;
    }
    setViewState(flyTo(scenarioId, cameraOverride));
  }, [scenarioId, cameraOverride]);

  useEffect(() => {
    if (phase === "accepted") {
      setViewState(flyTo(scenarioId, cameraOverride, 1.0));
    }
  }, [phase, scenarioId, cameraOverride]);

  useEffect(() => {
    const primaryHazard = weather.assessment?.intersectingHazards[0];
    if (!primaryHazard || !weather.assessment?.hazardous) return;
    if (phase !== "advisory" && phase !== "assessing") return;
    if (focusedHazardRef.current === primaryHazard.id) return;

    focusedHazardRef.current = primaryHazard.id;
    const isCyclone = primaryHazard.type === "cyclone";
    setViewState({
      longitude: primaryHazard.center[0] + (isCyclone ? 2.6 : 0),
      latitude: primaryHazard.center[1] - (isCyclone ? 1.6 : 0),
      zoom: isCyclone ? 3.9 : 4.8,
      pitch: 0,
      bearing: 0,
      transitionDuration: 1400,
      transitionInterpolator: new FlyToInterpolator({ speed: 1.1 }),
    });
  }, [phase, weather.assessment]);

  useEffect(() => {
    const prevId = prevActiveRef.current;
    if (prevId === activeRouteId) return;
    prevActiveRef.current = activeRouteId;

    if (phase !== "accepted") {
      setFadingOutRouteId(null);
      setFadeOpacity(1);
      setNewRouteOpacity(1);
      return;
    }

    setFadingOutRouteId(prevId);
    setFadeOpacity(1);
    setNewRouteOpacity(0);

    const start = performance.now();
    let frame = requestAnimationFrame(function tick(now: number) {
      const t = Math.min(1, (now - start) / SWAP_DURATION_MS);
      setFadeOpacity(1 - t);
      setNewRouteOpacity(t);
      if (t < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        setFadingOutRouteId(null);
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [activeRouteId, phase]);

  useEffect(() => {
    const id = setInterval(() => {
      setPulseTick((t) => (t + 1) % 10000);
    }, 100);
    return () => clearInterval(id);
  }, []);

  const polygonActive =
    phase === "advisory" || phase === "assessing" || phase === "decision";

  const layers = useMemo(() => {
    if (!scenario) return [];

    const routesById = new Map<string, Route>(
      scenario.routes.map((r) => [r.id, r]),
    );
    const activeRoute =
      routesById.get(activeRouteId) ??
      scenario.routes.find((r) => r.isCurrent) ??
      scenario.routes[0];
    const complianceProfile = getScenarioComplianceProfile(scenario);
    const maskingActive = complianceMode && complianceProfile !== null;
    const maskTrigger = maskingActive
      ? `mask:${vesselProgress.toFixed(5)}`
      : "";
    const maskedRoutes = new Map<
      string,
      { route: Route; result: MaskedRouteResult }
    >();
    const renderRoute = (route: Route) => {
      if (!maskingActive) return route;
      const cached = maskedRoutes.get(route.id);
      if (cached) return cached.route;
      const result = computeMaskedRoute(route.waypoints, vesselProgress);
      const maskedRoute = { ...route, waypoints: result.visibleWaypoints };
      maskedRoutes.set(route.id, { route: maskedRoute, result });
      return maskedRoute;
    };
    const maskedResultFor = (route: Route) => {
      if (!maskingActive) return null;
      const cached = maskedRoutes.get(route.id);
      if (cached) return cached.result;
      renderRoute(route);
      return maskedRoutes.get(route.id)?.result ?? null;
    };
    const activeMaskedResult = maskedResultFor(activeRoute);
    const recommendedRoute = recommendedRouteId
      ? routesById.get(recommendedRouteId)
      : undefined;
    const altARoute = alternativeRouteIds
      ? routesById.get(alternativeRouteIds[0])
      : undefined;
    const altBRoute = alternativeRouteIds
      ? routesById.get(alternativeRouteIds[1])
      : undefined;
    const fadingRoute = fadingOutRouteId
      ? routesById.get(fadingOutRouteId)
      : undefined;
    const weatherAssessment = weather.assessment;
    const weatherHazardous =
      Boolean(weatherAssessment?.hazardous) &&
      (weatherAssessment?.maxSeverity ?? 0) >= 3;
    const weatherRecommendedRoute = weatherAssessment?.recommendedRouteId
      ? routesById.get(weatherAssessment.recommendedRouteId)
      : undefined;
    const isWeatherHazardRoute = (route: Route) =>
      weatherHazardous && route.id === weatherAssessment?.hazardousRouteId;
    const isWeatherSafeRoute = (route: Route) =>
      weatherHazardous && route.id === weatherAssessment?.recommendedRouteId;
    const operationalRouteColor = (
      route: Route,
      fallback: [number, number, number, number],
    ): [number, number, number, number] => {
      if (isWeatherHazardRoute(route)) return WEATHER_ROUTE_RED;
      if (isWeatherSafeRoute(route)) return WEATHER_SAFE_GREEN;
      return fallback;
    };

    const ports: Port[] = [scenario.voyage.from, scenario.voyage.to];

    const routeLayers = [];
    const trigger = `sel:${selectedRouteId ?? ""}|phase:${phase}|active:${activeRouteId}`;

    if (phase === "decision" && recommendedRoute && altARoute && altBRoute) {
      const dimOthers = selectedRouteId != null;
      const recDim = dimOthers && selectedRouteId !== recommendedRoute.id;
      const altADim = dimOthers && selectedRouteId !== altARoute.id;
      const altBDim = dimOthers && selectedRouteId !== altBRoute.id;

      const recommendedColor = scenario.isCustom
        ? customRouteColor(recommendedRoute, scenario.routes)
        : operationalRouteColor(recommendedRoute, ROUTE_GREEN);
      const altAColor = scenario.isCustom
        ? customRouteColor(altARoute, scenario.routes)
        : operationalRouteColor(altARoute, ROUTE_BLUE);
      const altBColor = scenario.isCustom
        ? customRouteColor(altBRoute, scenario.routes)
        : operationalRouteColor(altBRoute, ROUTE_RED_MUTED);

      if (altBRoute.id !== recommendedRoute.id) {
        routeLayers.push(
          buildRouteLayer(renderRoute(altBRoute), dimColor(altBColor, altBDim), {
            id: "route-alt-b",
            width: selectedRouteId === altBRoute.id ? 3 : 2,
            trigger,
            pathTrigger: maskTrigger,
          }),
        );
      }
      if (altARoute.id !== recommendedRoute.id && altARoute.id !== altBRoute.id) {
        routeLayers.push(
          buildRouteLayer(renderRoute(altARoute), dimColor(altAColor, altADim), {
            id: "route-alt-a",
            width: selectedRouteId === altARoute.id ? 4 : 3,
            trigger,
            pathTrigger: maskTrigger,
          }),
        );
      }
      routeLayers.push(
        buildRouteLayer(
          renderRoute(recommendedRoute),
          dimColor(recommendedColor, recDim),
          {
            id: "route-recommended",
            width: selectedRouteId === recommendedRoute.id ? 6 : 5,
            trigger,
            pathTrigger: maskTrigger,
          },
        ),
      );
    } else {
      if (fadingRoute && fadingRoute.id !== activeRoute.id) {
        const fadeBase = scenario.isCustom
          ? customRouteColor(fadingRoute, scenario.routes)
          : ROUTE_GREEN;
        const alpha = Math.round(fadeBase[3] * fadeOpacity);
        routeLayers.push(
          buildRouteLayer(
            renderRoute(fadingRoute),
            [fadeBase[0], fadeBase[1], fadeBase[2], alpha],
            {
              id: "route-fade",
              width: 4,
              trigger: `fade:${alpha}`,
              pathTrigger: maskTrigger,
            },
          ),
        );
      }
      const activeBase = scenario.isCustom
        ? customRouteColor(activeRoute, scenario.routes)
        : operationalRouteColor(activeRoute, ROUTE_GREEN);
      const activeColor = fadingOutRouteId
        ? withOpacity(activeBase, newRouteOpacity)
        : activeBase;
      if (
        weatherHazardous &&
        weatherRecommendedRoute &&
        weatherRecommendedRoute.id !== activeRoute.id
      ) {
        const previewAlpha =
          phase === "advisory" || phase === "assessing" ? 170 : 135;
        routeLayers.push(
          buildRouteLayer(
            renderRoute(weatherRecommendedRoute),
            [
              WEATHER_SAFE_GREEN[0],
              WEATHER_SAFE_GREEN[1],
              WEATHER_SAFE_GREEN[2],
              previewAlpha,
            ],
            {
              id: "route-weather-safe-preview",
              width: phase === "advisory" || phase === "assessing" ? 4 : 3,
              trigger: `weather:${weatherRecommendedRoute.id}:${previewAlpha}`,
              pathTrigger: maskTrigger,
            },
          ),
        );
      }
      routeLayers.push(
        buildRouteLayer(
          renderRoute(activeRoute),
          activeColor,
          {
            trigger: `active:${activeColor.join(",")}|${phase}`,
            pathTrigger: maskTrigger,
          },
        ),
      );
    }

    const activeComplianceZone = activeMaskedResult?.activeZone ?? null;
    const complianceZoneLayer =
      maskingActive && activeComplianceZone
        ? new PolygonLayer<ComplianceZone>({
            id: `compliance-zone-${activeComplianceZone.id}`,
            data: [activeComplianceZone],
            getPolygon: (d) => bboxToPolygon(d.bbox),
            getFillColor: (d) =>
              COMPLIANCE_OVERLAY_COLORS[
                d.profile as Exclude<ComplianceProfile, "international_imo">
              ]?.fill ?? [148, 163, 184, 0],
            getLineColor: (d) =>
              COMPLIANCE_OVERLAY_COLORS[
                d.profile as Exclude<ComplianceProfile, "international_imo">
              ]?.line ?? [148, 163, 184, 0],
            lineWidthUnits: "pixels",
            getLineWidth: 1.5,
            stroked: true,
            filled: true,
            pickable: false,
            updateTriggers: {
              getPolygon: `${activeComplianceZone.id}:${vesselProgress}`,
              getFillColor: activeComplianceZone.id,
              getLineColor: activeComplianceZone.id,
            },
          })
        : null;
    const complianceVesselLayer =
      maskingActive && activeMaskedResult
        ? new ScatterplotLayer<{ position: [number, number] }>({
            id: `vessel-position-compliance-${activeRoute.id}`,
            data: [{ position: activeMaskedResult.vesselPosition }],
            getPosition: (d) => d.position,
            getRadius: 8,
            radiusUnits: "pixels",
            getFillColor: [251, 191, 36, 255],
            getLineColor: [15, 23, 42, 255],
            lineWidthUnits: "pixels",
            getLineWidth: 2.5,
            stroked: true,
            pickable: false,
            updateTriggers: {
              getPosition: vesselProgress,
            },
          })
        : null;

    const primaryZoneIds =
      scenario.customThreatZoneIds ??
      CHOKEPOINT_META[scenario.chokepoint.id]?.defaultZoneIds ??
      [];
    const primaryZoneSet = new Set(primaryZoneIds);
    const customZones: DangerZone[] = scenario.isCustom
      ? getRelevantZonesForWaypoints(
          scenario.routes.flatMap((route) => route.waypoints),
          primaryZoneIds,
        )
      : [];

    const dangerZoneLayer =
      customZones.length > 0
        ? new PolygonLayer<DangerZone>({
            id: `danger-zones-${scenario.id}`,
            data: customZones,
            getPolygon: (d) => d.polygon,
            getFillColor: (d) =>
              dimColor(d.fillColor, !primaryZoneSet.has(d.id)),
            getLineColor: (d) =>
              dimColor(d.lineColor, !primaryZoneSet.has(d.id)),
            lineWidthMinPixels: 1.5,
            stroked: true,
            filled: true,
            pickable: true,
            autoHighlight: true,
            highlightColor: [255, 255, 255, 30],
          })
        : null;

    const criticalHazardIds = new Set(
      weatherAssessment?.intersectingHazards.map((hazard) => hazard.id) ?? [],
    );
    const weatherHazards = weather.hazards;
    const weatherZoneLayer =
      weatherHazards.length > 0
        ? new PolygonLayer<WeatherHazardZone>({
            id: `weather-zones-${scenario.id}`,
            data: weatherHazards,
            getPolygon: (d) => d.polygon,
            getFillColor: (d) => weatherFillColor(d, criticalHazardIds, pulseTick),
            getLineColor: (d) => weatherLineColor(d, criticalHazardIds),
            getLineWidth: (d) => (criticalHazardIds.has(d.id) ? 2.2 : 1.2),
            lineWidthUnits: "pixels",
            stroked: true,
            filled: true,
            pickable: true,
            autoHighlight: true,
            highlightColor: [255, 255, 255, 24],
            updateTriggers: {
              getFillColor: `${pulseTick}:${weatherHazards.length}`,
              getLineColor: weatherAssessment?.updatedAt ?? "",
            },
          })
        : null;
    const weatherGlowLayer =
      weatherHazards.some((hazard) => hazard.type === "cyclone")
        ? new PolygonLayer<WeatherHazardZone>({
            id: `weather-cyclone-glow-${scenario.id}`,
            data: weatherHazards.filter((hazard) => hazard.type === "cyclone"),
            getPolygon: (d) => d.polygon,
            getFillColor: (d) => [
              190,
              24,
              93,
              Math.round(
                (criticalHazardIds.has(d.id) ? 34 : 12) +
                  Math.sin(pulseTick / 6) * 12,
              ),
            ],
            getLineColor: [248, 113, 113, 0],
            stroked: false,
            filled: true,
            pickable: false,
            updateTriggers: { getFillColor: pulseTick },
          })
        : null;
    const tracks = weatherTracks(weatherHazards, criticalHazardIds);
    const weatherTrackLayer =
      tracks.length > 0
        ? new PathLayer<WeatherTrack>({
            id: `weather-tracks-${scenario.id}`,
            data: tracks,
            getPath: (d) => d.path,
            getColor: weatherTrackColor,
            getWidth: (d) => (d.critical ? 2 : 1),
            widthUnits: "pixels",
            capRounded: true,
            jointRounded: true,
            pickable: false,
            updateTriggers: {
              getColor: weatherAssessment?.updatedAt ?? "",
            },
          })
        : null;
    const weatherCenterLayer =
      weatherHazards.length > 0
        ? new TextLayer<WeatherHazardZone>({
            id: `weather-centers-${scenario.id}`,
            data: weatherHazards.filter((hazard) => hazard.severity >= 3),
            getPosition: (d) => d.center,
            getText: (d) => (d.type === "cyclone" ? "x" : "+"),
            getSize: (d) => (criticalHazardIds.has(d.id) ? 19 : 14),
            getColor: (d) => weatherLineColor(d, criticalHazardIds),
            getAngle: () => (pulseTick * 9) % 360,
            fontFamily: "Inter, system-ui, sans-serif",
            fontWeight: 800,
            fontSettings: { sdf: true },
            outlineWidth: 3,
            outlineColor: [15, 23, 42, 210],
            pickable: false,
            updateTriggers: {
              getAngle: pulseTick,
              getColor: weatherAssessment?.updatedAt ?? "",
            },
          })
        : null;

    return [
      ...(weatherGlowLayer ? [weatherGlowLayer] : []),
      ...(weatherZoneLayer ? [weatherZoneLayer] : []),
      ...(weatherTrackLayer ? [weatherTrackLayer] : []),
      ...(weatherCenterLayer ? [weatherCenterLayer] : []),
      ...(dangerZoneLayer ? [dangerZoneLayer] : []),
      ...(complianceZoneLayer ? [complianceZoneLayer] : []),
      buildRiskZoneLayer(scenario.chokepoint, polygonActive, pulseTick),
      ...routeLayers,
      new ScatterplotLayer<Port>({
        id: `ports-${scenario.id}`,
        data: ports,
        getPosition: (d) => d.position,
        getRadius: 7,
        radiusUnits: "pixels",
        getFillColor: [148, 163, 184, 255],
        getLineColor: [15, 23, 42, 255],
        lineWidthUnits: "pixels",
        getLineWidth: 1.5,
        stroked: true,
        pickable: true,
      }),
      new TextLayer<Port>({
        id: `port-labels-${scenario.id}`,
        data: ports,
        getPosition: (d) => d.position,
        getText: (d) => d.name,
        getSize: 12,
        getColor: [226, 232, 240, 230],
        getPixelOffset: [0, -16],
        fontFamily: "Inter, system-ui, sans-serif",
        fontWeight: 600,
        fontSettings: { sdf: true },
        outlineWidth: 2,
        outlineColor: [15, 23, 42, 255],
        getBackgroundColor: [15, 23, 42, 0],
      }),
      ...(complianceVesselLayer
        ? [complianceVesselLayer]
        : buildVesselLayer(scenario.vessel, iconStatus)),
    ];
  }, [
    scenario,
    activeRouteId,
    recommendedRouteId,
    alternativeRouteIds,
    selectedRouteId,
    phase,
    polygonActive,
    iconStatus,
    pulseTick,
    complianceMode,
    vesselProgress,
    fadingOutRouteId,
    fadeOpacity,
    newRouteOpacity,
    weather,
  ]);

  /* Bug-1 guard: if the store hasn't hydrated yet (scenario is
     null/undefined for one render cycle on reload), show a plain dark
     backdrop instead of DeckGL so PathLayer never interpolates from [0,0]. */
  if (!scenario) {
    return (
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "#0f172a" }}
      />
    );
  }

  const legendZones = scenario.isCustom
    ? getRelevantZonesForWaypoints(
        scenario.routes.flatMap((route) => route.waypoints),
        scenario.customThreatZoneIds ??
          CHOKEPOINT_META[scenario.chokepoint.id]?.defaultZoneIds ??
          [],
      )
    : [];
  const weatherZones = weather.hazards;
  const weatherStatusLabel =
    weather.status === "loading"
      ? "Weather sync"
      : weather.status === "live"
        ? "Live weather"
        : weather.status === "fallback"
          ? "Weather model"
          : weather.status === "unavailable"
            ? "Weather offline"
            : "Weather standby";
  const weatherStatusTone =
    weather.status === "unavailable" || weather.status === "fallback"
      ? "text-amber-200"
      : "text-cyan-200";

  return (
    <div className="absolute inset-0">
      <DeckGL
        viewState={viewState}
        onViewStateChange={(e) => setViewState(e.viewState as ViewState)}
        controller
        layers={layers}
        getTooltip={({ object }) => {
          if (!object) return null;
          const weatherZone = object as Partial<WeatherHazardZone>;
          if (
            weatherZone.metadata &&
            weatherZone.center &&
            weatherZone.label &&
            weatherZone.type
          ) {
            return {
              html: weatherTooltip(weatherZone as WeatherHazardZone),
              style: {
                background: "rgba(15,23,42,0.95)",
                border: "1px solid rgba(45,212,191,0.45)",
                borderRadius: "6px",
                padding: "8px 12px",
                color: "#e2e8f0",
              },
            };
          }
          const z = object as Partial<DangerZone>;
          if (
            !z.polygon ||
            !Array.isArray(z.polygon) ||
            !z.label ||
            !z.description
          ) {
            return null;
          }
          return {
            html: `<div style="font-family:Inter,sans-serif;font-size:11px;max-width:240px;line-height:1.5"><div style="font-weight:700;margin-bottom:4px;color:#f1f5f9">${z.label}</div><div style="color:#94a3b8">${z.description}</div><div style="margin-top:6px;color:#f59e0b;text-transform:uppercase;letter-spacing:0.08em;font-size:10px">Severity ${z.severity ?? "?"} · ${(z.type ?? "").toUpperCase()}</div></div>`,
            style: {
              background: "rgba(15,23,42,0.95)",
              border: "1px solid rgba(71,85,105,0.8)",
              borderRadius: "6px",
              padding: "8px 12px",
              color: "#e2e8f0",
            },
          };
        }}
      >
        <MapGL mapStyle={MAP_STYLE} reuseMaps />
      </DeckGL>

      {legendZones.length > 0 && (
        <div className="absolute top-4 right-[440px] z-10 hidden lg:block bg-slate-900/90 border border-slate-700 rounded-md p-3 backdrop-blur-sm max-w-[240px]">
          <p className="text-slate-400 uppercase tracking-widest text-[10px] font-semibold mb-2">
            Danger zones active
          </p>
          {legendZones.slice(0, 5).map((z) => (
            <div key={z.id} className="flex items-center gap-2 mb-1">
              <span
                className="w-2.5 h-2.5 rounded-sm shrink-0"
                style={{
                  background: `rgba(${z.lineColor[0]},${z.lineColor[1]},${z.lineColor[2]},0.9)`,
                }}
              />
              <span className="text-slate-300 text-[11px] truncate">
                {z.label}
              </span>
            </div>
          ))}
          {legendZones.length > 5 && (
            <p className="text-slate-500 text-[10px] mt-1">
              +{legendZones.length - 5} more zones
            </p>
          )}
        </div>
      )}

      <div className="absolute left-4 top-4 z-10 hidden md:block rounded-md border border-slate-700/70 bg-slate-950/75 px-3 py-2 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span
            className={`size-1.5 rounded-full ${
              weather.status === "live"
                ? "bg-cyan-300 animate-pulse"
                : weather.status === "loading"
                  ? "bg-slate-400 animate-pulse"
                  : "bg-amber-300"
            }`}
          />
          <span
            className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${weatherStatusTone}`}
          >
            {weatherStatusLabel}
          </span>
          <span className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
            {weatherZones.length} zones
          </span>
        </div>
        {weather.message && (
          <div className="mt-1 max-w-[260px] truncate text-[11px] text-slate-400">
            {weather.message}
          </div>
        )}
      </div>
    </div>
  );
}
