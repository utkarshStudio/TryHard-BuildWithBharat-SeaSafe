// @ts-expect-error - searoute-js ships no type declarations
import searoute from "searoute-js";

export type LonLat = [number, number];

interface SearouteResult {
  geometry?: { coordinates?: LonLat[] };
}

function toPoint(coord: LonLat) {
  return {
    type: "Feature" as const,
    properties: {},
    geometry: { type: "Point" as const, coordinates: coord },
  };
}

// searoute-js logs a stray debug line on every snap, plus a "No route
// found" line when a pair of points can't be connected. Both are noisy
// and not useful to us, so we swallow console.log for the duration of
// the call only.
function quiet<T>(fn: () => T): T {
  const original = console.log;
  // eslint-disable-next-line no-console
  console.log = () => {};
  try {
    return fn();
  } finally {
    console.log = original;
  }
}

function rawSeaRoute(a: LonLat, b: LonLat): LonLat[] | null {
  return quiet(() => {
    try {
      const result = searoute(toPoint(a), toPoint(b)) as SearouteResult | null;
      const coords = result?.geometry?.coordinates;
      return coords && coords.length >= 2 ? coords : null;
    } catch {
      return null;
    }
  });
}

// The bundled maritime network (marnet) has small gaps near a handful of
// harbours/coastal points where the nearest lane segment isn't connected
// to the rest of the network graph. When that happens we nudge the point
// a little (in degrees) and retry. This resolves the large majority of
// real-world port coordinates without needing to hand-tune every port
// position in customRoutePlanner.ts.
const NUDGES: LonLat[] = [
  [0, 0],
  [0.3, 0], [-0.3, 0], [0, 0.3], [0, -0.3],
  [0.3, 0.3], [-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3],
  [0.7, 0], [-0.7, 0], [0, 0.7], [0, -0.7],
  [1, 1], [-1, -1], [1, -1], [-1, 1],
  [2, 0], [-2, 0], [0, 2], [0, -2],
  [2, -2], [-2, 2], [2, 2], [-2, -2],
];

function findRoute(a: LonLat, b: LonLat): LonLat[] | null {
  for (const [dx, dy] of NUDGES) {
    const route = rawSeaRoute([a[0] + dx, a[1] + dy], b);
    if (route) return route;
  }
  for (const [dx, dy] of NUDGES) {
    const route = rawSeaRoute(a, [b[0] + dx, b[1] + dy]);
    if (route) return route;
  }
  return null;
}

/**
 * Returns waypoints that follow real shipping lanes between two points,
 * using the searoute-js maritime network (built from actual sea lane
 * data, not straight lines). Falls back to a direct line only if no lane
 * connects the two points at all (rare — isolated network gaps).
 */
export function seaSegment(from: LonLat, to: LonLat): LonLat[] {
  if (from[0] === to[0] && from[1] === to[1]) return [from];
  const route = findRoute(from, to);
  return route ?? [from, to];
}
