import {
  classifyWaypoint,
  type ComplianceZone,
} from "@/lib/compliance/zones";

export type CompliancePoint = [number, number];

export interface MaskedRouteResult {
  /** Waypoints to render on the map - the compliant visible window. */
  visibleWaypoints: CompliancePoint[];
  /** The vessel's current interpolated position. */
  vesselPosition: CompliancePoint;
  /** null means international waters / IMO default. */
  activeZone: ComplianceZone | null;
  /** Number of original waypoints already behind the vessel. */
  maskedSegmentCount: number;
  /** True only when a regulated zone is actively governing the vessel. */
  complianceModeActive: boolean;
}

const samePoint = (a: CompliancePoint, b: CompliancePoint) =>
  Math.abs(a[0] - b[0]) < 0.000001 && Math.abs(a[1] - b[1]) < 0.000001;

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

function lerp(a: CompliancePoint, b: CompliancePoint, t: number): CompliancePoint {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

export function haversineNm(
  [lng1, lat1]: CompliancePoint,
  [lng2, lat2]: CompliancePoint,
): number {
  const radiusNm = 3440.065;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const rLat1 = toRad(lat1);
  const rLat2 = toRad(lat2);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLng / 2) ** 2;
  return radiusNm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function cumulativeDistances(waypoints: CompliancePoint[]) {
  const distances = [0];
  for (let i = 1; i < waypoints.length; i += 1) {
    distances.push(distances[i - 1] + haversineNm(waypoints[i - 1], waypoints[i]));
  }
  return distances;
}

function pointAtDistance(
  waypoints: CompliancePoint[],
  distances: number[],
  targetNm: number,
): CompliancePoint {
  if (waypoints.length === 0) return [0, 0];
  if (targetNm <= 0) return waypoints[0];

  const totalNm = distances[distances.length - 1] ?? 0;
  if (targetNm >= totalNm) return waypoints[waypoints.length - 1];

  const segmentIndex = distances.findIndex((distance) => distance >= targetNm);
  const endIndex =
    segmentIndex <= 0 ? 1 : Math.min(segmentIndex, waypoints.length - 1);
  const startIndex = endIndex - 1;
  const segmentStart = distances[startIndex];
  const segmentEnd = distances[endIndex];
  const segmentNm = Math.max(0.000001, segmentEnd - segmentStart);
  return lerp(
    waypoints[startIndex],
    waypoints[endIndex],
    (targetNm - segmentStart) / segmentNm,
  );
}

export function interpolatePosition(
  waypoints: CompliancePoint[],
  t: number,
): CompliancePoint {
  if (waypoints.length === 0) return [0, 0];
  if (waypoints.length === 1) return waypoints[0];

  const distances = cumulativeDistances(waypoints);
  const totalNm = distances[distances.length - 1] ?? 0;
  return pointAtDistance(waypoints, distances, totalNm * clamp01(t));
}

export function computeMaskedRoute(
  waypoints: CompliancePoint[],
  t: number,
): MaskedRouteResult {
  if (waypoints.length === 0) {
    return {
      visibleWaypoints: [],
      vesselPosition: [0, 0],
      activeZone: null,
      maskedSegmentCount: 0,
      complianceModeActive: false,
    };
  }

  if (waypoints.length === 1) {
    const activeZone = classifyWaypoint(waypoints[0][0], waypoints[0][1]);
    return {
      visibleWaypoints: [waypoints[0]],
      vesselPosition: waypoints[0],
      activeZone,
      maskedSegmentCount: 0,
      complianceModeActive: activeZone !== null,
    };
  }

  const progress = clamp01(t);
  const distances = cumulativeDistances(waypoints);
  const totalNm = distances[distances.length - 1] ?? 0;
  const currentNm = totalNm * progress;
  const vesselPosition = pointAtDistance(waypoints, distances, currentNm);
  const activeZone = classifyWaypoint(vesselPosition[0], vesselPosition[1]);
  const lookAheadNm = activeZone?.lookAheadNm ?? 200;
  const endNm = Math.min(totalNm, currentNm + lookAheadNm);

  const visibleWaypoints: CompliancePoint[] = [vesselPosition];

  for (let i = 1; i < waypoints.length; i += 1) {
    if (distances[i] <= currentNm) continue;
    if (distances[i] > endNm) break;
    const waypoint = waypoints[i];
    if (!samePoint(visibleWaypoints[visibleWaypoints.length - 1], waypoint)) {
      visibleWaypoints.push(waypoint);
    }
  }

  const endPoint = pointAtDistance(waypoints, distances, endNm);
  if (!samePoint(visibleWaypoints[visibleWaypoints.length - 1], endPoint)) {
    visibleWaypoints.push(endPoint);
  }

  const maskedSegmentCount = Math.min(
    waypoints.length - 1,
    distances.filter((distance) => distance < currentNm).length,
  );

  return {
    visibleWaypoints,
    vesselPosition,
    activeZone,
    maskedSegmentCount,
    complianceModeActive: activeZone !== null,
  };
}

export { classifyWaypoint };
