export type DangerZoneType =
  | "conflict"
  | "weather"
  | "piracy"
  | "congestion"
  | "geopolitical"
  | "environmental";

export interface DangerZone {
  id: string;
  label: string;
  type: DangerZoneType;
  severity: 1 | 2 | 3 | 4 | 5;
  polygon: [number, number][];
  description: string;
  fillColor: [number, number, number, number];
  lineColor: [number, number, number, number];
}

export const DANGER_ZONES: DangerZone[] = [
  {
    id: "bab_el_mandeb_core",
    label: "Bab-el-Mandeb — Houthi Missile Zone",
    type: "conflict",
    severity: 4,
    polygon: [
      [43.0, 11.0],
      [44.5, 11.0],
      [44.5, 13.5],
      [43.0, 13.5],
      [43.0, 11.0],
    ],
    description:
      "Active Houthi anti-ship missile and drone operations. IMB reports 18 attacks 2024.",
    fillColor: [239, 68, 68, 55],
    lineColor: [239, 68, 68, 200],
  },
  {
    id: "red_sea_north",
    label: "Red Sea — Extended Threat Corridor",
    type: "conflict",
    severity: 3,
    polygon: [
      [32.0, 20.0],
      [43.5, 20.0],
      [43.5, 27.5],
      [32.5, 27.5],
      [32.0, 20.0],
    ],
    description:
      "Extended Houthi-threatened corridor. War-risk insurance surcharges 10× baseline.",
    fillColor: [239, 68, 68, 35],
    lineColor: [239, 68, 68, 140],
  },
  {
    id: "gulf_of_aden_corridor",
    label: "Gulf of Aden — Piracy / Missile Corridor",
    type: "conflict",
    severity: 3,
    polygon: [
      [44.0, 11.0],
      [52.0, 11.0],
      [52.0, 14.5],
      [44.0, 14.5],
      [44.0, 11.0],
    ],
    description:
      "Historical piracy zone now also subject to Houthi drone and missile attacks westbound.",
    fillColor: [239, 68, 68, 45],
    lineColor: [239, 68, 68, 170],
  },
  {
    id: "hormuz_strait",
    label: "Strait of Hormuz — IRGCN Seizure Zone",
    type: "conflict",
    severity: 3,
    polygon: [
      [55.8, 25.8],
      [57.5, 25.8],
      [57.5, 27.0],
      [55.8, 27.0],
      [55.8, 25.8],
    ],
    description:
      "Iranian IRGCN vessel seizure operations. 4 tankers detained in 72-hr window.",
    fillColor: [239, 68, 68, 55],
    lineColor: [239, 68, 68, 200],
  },
  {
    id: "persian_gulf_inner",
    label: "Persian Gulf — Restricted Transit",
    type: "geopolitical",
    severity: 2,
    polygon: [
      [48.0, 24.0],
      [56.5, 24.0],
      [56.5, 27.5],
      [48.0, 27.5],
      [48.0, 24.0],
    ],
    description:
      "Heightened naval presence. Mandatory AIS broadcast. Risk of inspection/boarding.",
    fillColor: [99, 102, 241, 40],
    lineColor: [99, 102, 241, 150],
  },
  {
    id: "malacca_piracy",
    label: "Malacca Strait — Active Piracy Zone",
    type: "piracy",
    severity: 2,
    polygon: [
      [99.5, 1.0],
      [104.5, 1.0],
      [104.5, 5.5],
      [99.5, 5.5],
      [99.5, 1.0],
    ],
    description:
      "IMB reports 5 boardings in 2 weeks. Armed robbery at anchor in Singapore approaches.",
    fillColor: [249, 115, 22, 50],
    lineColor: [249, 115, 22, 180],
  },
  {
    id: "cyclone_hamoon_track",
    label: "Arabian Sea — Cyclone Track (Cat 3)",
    type: "weather",
    severity: 5,
    polygon: [
      [62.0, 14.0],
      [72.0, 14.0],
      [72.0, 22.0],
      [62.0, 22.0],
      [62.0, 14.0],
    ],
    description:
      "Category 3 cyclone, 105-kt sustained winds. 48-hr projected track. BOM advisory active.",
    fillColor: [168, 85, 247, 55],
    lineColor: [168, 85, 247, 200],
  },
  {
    id: "cyclone_outer_bands",
    label: "Cyclone Outer Bands — Severe Swell",
    type: "weather",
    severity: 3,
    polygon: [
      [58.0, 11.0],
      [78.0, 11.0],
      [78.0, 25.0],
      [58.0, 25.0],
      [58.0, 11.0],
    ],
    description:
      "6–8m swell in outer bands. Deck cargo risk. Reduce speed to 10 kt recommended.",
    fillColor: [168, 85, 247, 25],
    lineColor: [168, 85, 247, 100],
  },
  {
    id: "cape_storm_corridor",
    label: "Cape of Good Hope — Storm Corridor",
    type: "weather",
    severity: 2,
    polygon: [
      [14.0, -40.0],
      [22.0, -40.0],
      [22.0, -34.0],
      [14.0, -34.0],
      [14.0, -40.0],
    ],
    description:
      "Persistent Southern Ocean swells 4–6m. Cape Doctor winds 40–60 kt Oct–Mar.",
    fillColor: [168, 85, 247, 40],
    lineColor: [168, 85, 247, 150],
  },
  {
    id: "south_china_sea_dispute",
    label: "South China Sea — Contested Waters",
    type: "geopolitical",
    severity: 2,
    polygon: [
      [109.0, 5.0],
      [121.0, 5.0],
      [121.0, 21.0],
      [109.0, 21.0],
      [109.0, 5.0],
    ],
    description:
      "Territorial disputes. Naval presence from multiple states. Risk of challenge/escort.",
    fillColor: [99, 102, 241, 35],
    lineColor: [99, 102, 241, 130],
  },
  {
    id: "luzon_strait_typhoon",
    label: "Luzon Strait — Typhoon Season Zone",
    type: "weather",
    severity: 2,
    polygon: [
      [120.0, 18.0],
      [126.0, 18.0],
      [126.0, 23.0],
      [120.0, 23.0],
      [120.0, 18.0],
    ],
    description:
      "Peak typhoon season (Jun–Nov). Category 3+ storms average 3.2/season through this corridor.",
    fillColor: [168, 85, 247, 40],
    lineColor: [168, 85, 247, 140],
  },
  {
    id: "bosphorus_congestion",
    label: "Turkish Straits — Navigation Restriction",
    type: "congestion",
    severity: 2,
    polygon: [
      [26.0, 39.8],
      [30.0, 39.8],
      [30.0, 41.3],
      [26.0, 41.3],
      [26.0, 39.8],
    ],
    description:
      "Mandatory TSS pilotage. 7-day average wait. Fog closures Nov–Feb average 12 days/yr.",
    fillColor: [234, 179, 8, 45],
    lineColor: [234, 179, 8, 160],
  },
  {
    id: "black_sea_conflict",
    label: "Black Sea — Active Conflict Zone",
    type: "conflict",
    severity: 5,
    polygon: [
      [28.0, 42.0],
      [41.5, 42.0],
      [41.5, 46.5],
      [28.0, 46.5],
      [28.0, 42.0],
    ],
    description:
      "Ongoing naval conflict. Uncharted mines reported. JWC High Risk Area declared.",
    fillColor: [239, 68, 68, 65],
    lineColor: [239, 68, 68, 220],
  },
  {
    id: "lombok_traffic",
    label: "Lombok Strait — Deep Water Alternate",
    type: "congestion",
    severity: 1,
    polygon: [
      [115.5, -9.0],
      [116.5, -9.0],
      [116.5, -8.0],
      [115.5, -8.0],
      [115.5, -9.0],
    ],
    description:
      "Narrow 18-nm wide strait. Increased traffic after Malacca avoidance. TSS active.",
    fillColor: [234, 179, 8, 30],
    lineColor: [234, 179, 8, 120],
  },
  {
    id: "taiwan_strait_tension",
    label: "Taiwan Strait — Geopolitical Flashpoint",
    type: "geopolitical",
    severity: 3,
    polygon: [
      [119.5, 21.0],
      [122.5, 21.0],
      [122.5, 26.0],
      [119.5, 26.0],
      [119.5, 21.0],
    ],
    description:
      "Elevated PLA naval activity. Military exercises with exclusion zones declared periodically.",
    fillColor: [99, 102, 241, 50],
    lineColor: [99, 102, 241, 180],
  },
];

export function getRelevantZones(
  originLng: number,
  originLat: number,
  destLng: number,
  destLat: number,
): DangerZone[] {
  return getRelevantZonesForWaypoints([
    [originLng, originLat],
    [destLng, destLat],
  ]);
}

export function getRelevantZonesForWaypoints(
  waypoints: [number, number][],
  extraZoneIds: string[] = [],
): DangerZone[] {
  if (waypoints.length === 0) return [];

  const lngs = waypoints.map((p) => p[0]);
  const lats = waypoints.map((p) => p[1]);
  const minLng = Math.min(...lngs) - 15;
  const maxLng = Math.max(...lngs) + 15;
  const minLat = Math.min(...lats) - 15;
  const maxLat = Math.max(...lats) + 15;
  const extra = new Set(extraZoneIds);

  return DANGER_ZONES.filter((zone) => {
    if (extra.has(zone.id)) return true;

    const zoneLngs = zone.polygon.map((p) => p[0]);
    const zoneLats = zone.polygon.map((p) => p[1]);
    const zMinLng = Math.min(...zoneLngs);
    const zMaxLng = Math.max(...zoneLngs);
    const zMinLat = Math.min(...zoneLats);
    const zMaxLat = Math.max(...zoneLats);
    return (
      zMinLng <= maxLng &&
      zMaxLng >= minLng &&
      zMinLat <= maxLat &&
      zMaxLat >= minLat
    );
  });
}

export const DANGER_ZONES_BY_ID: Record<string, DangerZone> = Object.fromEntries(
  DANGER_ZONES.map((z) => [z.id, z]),
);
