import type { Route } from "@/lib/types";
import type { WeatherHazardZone } from "@/lib/weather/types";

export interface RouteHazardDetectionResult {
  hazardous: boolean;
  intersectingHazards: WeatherHazardZone[];
  maxSeverity: number;
}

export function detectRouteHazards(
  route: Route | undefined,
  hazardZones: WeatherHazardZone[],
): RouteHazardDetectionResult {
  if (!route || route.waypoints.length < 2 || hazardZones.length === 0) {
    return { hazardous: false, intersectingHazards: [], maxSeverity: 0 };
  }

  const intersectingHazards = hazardZones.filter((zone) =>
    routeIntersectsPolygon(route.waypoints, zone.polygon),
  );

  return {
    hazardous: intersectingHazards.length > 0,
    intersectingHazards,
    maxSeverity: intersectingHazards.reduce(
      (max, zone) => Math.max(max, zone.severity),
      0,
    ),
  };
}

export function routeIntersectsPolygon(
  waypoints: [number, number][],
  polygon: [number, number][],
): boolean {
  if (waypoints.length === 0 || polygon.length < 3) return false;
  if (!bboxIntersects(bboxFor(waypoints), bboxFor(polygon))) return false;

  if (waypoints.some((point) => pointInPolygon(point, polygon))) return true;
  if (polygon.some((point) => pointOnRoute(point, waypoints))) return true;

  for (let i = 0; i < waypoints.length - 1; i += 1) {
    const a = waypoints[i];
    const b = waypoints[i + 1];
    for (let j = 0; j < polygon.length; j += 1) {
      const c = polygon[j];
      const d = polygon[(j + 1) % polygon.length];
      if (segmentsIntersect(a, b, c, d)) return true;
    }
  }

  return false;
}

export function pointInPolygon(
  point: [number, number],
  polygon: [number, number][],
): boolean {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const crosses =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / ((yj - yi) || Number.EPSILON) + xi;
    if (crosses) inside = !inside;
  }

  return inside;
}

function pointOnRoute(point: [number, number], waypoints: [number, number][]) {
  return waypoints.some((candidate) => distanceDeg(candidate, point) < 0.05);
}

function segmentsIntersect(
  a: [number, number],
  b: [number, number],
  c: [number, number],
  d: [number, number],
): boolean {
  const o1 = orientation(a, b, c);
  const o2 = orientation(a, b, d);
  const o3 = orientation(c, d, a);
  const o4 = orientation(c, d, b);

  if (o1 !== o2 && o3 !== o4) return true;
  if (o1 === 0 && onSegment(a, c, b)) return true;
  if (o2 === 0 && onSegment(a, d, b)) return true;
  if (o3 === 0 && onSegment(c, a, d)) return true;
  if (o4 === 0 && onSegment(c, b, d)) return true;
  return false;
}

function orientation(
  a: [number, number],
  b: [number, number],
  c: [number, number],
) {
  const value = (b[1] - a[1]) * (c[0] - b[0]) - (b[0] - a[0]) * (c[1] - b[1]);
  if (Math.abs(value) < 1e-9) return 0;
  return value > 0 ? 1 : 2;
}

function onSegment(
  a: [number, number],
  b: [number, number],
  c: [number, number],
) {
  return (
    b[0] <= Math.max(a[0], c[0]) &&
    b[0] >= Math.min(a[0], c[0]) &&
    b[1] <= Math.max(a[1], c[1]) &&
    b[1] >= Math.min(a[1], c[1])
  );
}

function bboxFor(points: [number, number][]) {
  const lngs = points.map((point) => point[0]);
  const lats = points.map((point) => point[1]);
  return {
    west: Math.min(...lngs),
    east: Math.max(...lngs),
    south: Math.min(...lats),
    north: Math.max(...lats),
  };
}

function bboxIntersects(
  a: ReturnType<typeof bboxFor>,
  b: ReturnType<typeof bboxFor>,
) {
  return a.west <= b.east && a.east >= b.west && a.south <= b.north && a.north >= b.south;
}

function distanceDeg(a: [number, number], b: [number, number]) {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}
