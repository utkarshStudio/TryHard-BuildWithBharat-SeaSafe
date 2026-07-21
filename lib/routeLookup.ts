export interface RouteWaypoints {
  id: string;
  label: string;
  waypoints: [number, number][];
  distanceNm: number;
  etaHours: number;
}

export interface LookupEntry {
  id: string;
  chokepointId: string;
  originLabel: string;
  destLabel: string;
  originCoords: [number, number];
  destCoords: [number, number];
  cameraZoom: number;
  cameraCenter: [number, number];
  complianceProfileIds: string[];
  directRoute: RouteWaypoints;
  safeRoute: RouteWaypoints;
}

export const ROUTE_LOOKUP: LookupEntry[] = [
  {
    id: "sg-rtm-suez",
    chokepointId: "bab_el_mandeb",
    originLabel: "Singapore",
    destLabel: "Rotterdam",
    originCoords: [103.85, 1.29],
    destCoords: [4.14, 51.95],
    cameraZoom: 2.2,
    cameraCenter: [50, 25],
    complianceProfileIds: [
      "india_eez_west",
      "eu_mediterranean",
      "eu_north_sea",
    ],
    directRoute: {
      id: "direct-sg-rtm-suez",
      label: "Singapore -> Suez -> Rotterdam",
      waypoints: [[103.85,1.29],[99.5,4.5],[80,6],[65,11.5],[43.5,12.5],[38,20],[32.5,30],[25,35],[-5.5,36],[-5,45],[2,50],[4.14,51.95]],
      distanceNm: 8440,
      etaHours: 624,
    },
    safeRoute: {
      id: "safe-sg-rtm-cape",
      label: "Singapore -> Cape of Good Hope -> Rotterdam",
      waypoints: [[103.85,1.29],[99.5,-2],[90,-10],[70,-18],[45,-25],[18.5,-34.2],[0,-35],[-15,-30],[-5,15],[-5,36],[2,50],[4.14,51.95]],
      distanceNm: 11780,
      etaHours: 888,
    },
  },
  {
    id: "sg-uae-hormuz",
    chokepointId: "hormuz",
    originLabel: "Singapore",
    destLabel: "UAE",
    originCoords: [103.85, 1.29],
    destCoords: [52.87, 25.15],
    cameraZoom: 3.2,
    cameraCenter: [78, 13],
    complianceProfileIds: [
      "india_eez_west",
      "uae_gulf_of_oman",
      "uae_gulf",
    ],
    directRoute: {
      id: "direct-sg-uae-hormuz",
      label: "Singapore -> Hormuz -> UAE",
      waypoints: [[103.85,1.29],[99.5,4.5],[80,6],[65,11.5],[58,22],[56.5,26.2],[52.87,25.15]],
      distanceNm: 3600,
      etaHours: 200,
    },
    safeRoute: {
      id: "safe-sg-uae-fujairah",
      label: "Singapore -> Gulf of Oman -> Fujairah",
      waypoints: [[103.85,1.29],[99.5,4.5],[80,6],[65,11.5],[60,18],[58.5,24.5],[56.65,25.35]],
      distanceNm: 2475,
      etaHours: 138,
    },
  },
  {
    id: "cn-nyc-panama",
    chokepointId: "panama_canal",
    originLabel: "Shanghai",
    destLabel: "New York",
    originCoords: [121.47, 31.23],
    destCoords: [-74.01, 40.71],
    cameraZoom: 1.8,
    cameraCenter: [-45, 24],
    complianceProfileIds: ["india_eez_east", "eu_mediterranean"],
    directRoute: {
      id: "direct-cn-nyc-panama",
      label: "Shanghai -> Panama -> New York",
      waypoints: [[121.47,31.23],[140,25],[170,20],[-170,18],[-140,15],[-110,12],[-90,10],[-79.5,9],[-78,12],[-75,25],[-74.01,40.71]],
      distanceNm: 11000,
      etaHours: 827,
    },
    safeRoute: {
      id: "safe-cn-nyc-suez",
      label: "Shanghai -> Malacca -> Suez -> New York",
      waypoints: [[121.47,31.23],[115,22],[105,8],[95,5],[80,8],[60,12],[45,12.5],[32.55,29.97],[25,35],[-5.5,36],[-15,41],[-30,46],[-50,44],[-66,42],[-74.01,40.71]],
      distanceNm: 12400,
      etaHours: 689,
    },
  },
  {
    id: "cn-bom-malacca",
    chokepointId: "malacca",
    originLabel: "Guangzhou",
    destLabel: "Mumbai",
    originCoords: [113.88, 22.5],
    destCoords: [72.84, 18.94],
    cameraZoom: 3.4,
    cameraCenter: [90, 12],
    complianceProfileIds: ["india_eez_west", "india_territorial"],
    directRoute: {
      id: "direct-cn-bom-malacca",
      label: "Guangzhou -> Malacca -> Mumbai",
      waypoints: [[113.88,22.5],[108,12],[103.85,1.29],[99.5,4.5],[95,6],[85,8],[80,9],[75,12],[72.84,18.94]],
      distanceNm: 3100,
      etaHours: 172,
    },
    safeRoute: {
      id: "safe-cn-bom-sunda",
      label: "Guangzhou -> Sunda Strait -> Mumbai",
      waypoints: [[113.88,22.5],[110,12],[106.5,-6.2],[100,5],[90,6],[80,7],[75,10],[72.84,18.94]],
      distanceNm: 3480,
      etaHours: 193,
    },
  },
  {
    id: "bom-cmb-cyclone",
    chokepointId: "arabian_sea_cyclone",
    originLabel: "Mumbai",
    destLabel: "Colombo",
    originCoords: [72.84, 18.94],
    destCoords: [79.85, 6.92],
    cameraZoom: 4.2,
    cameraCenter: [74, 12],
    complianceProfileIds: ["india_eez_west", "india_territorial"],
    directRoute: {
      id: "direct-bom-cmb",
      label: "Mumbai -> Colombo (direct)",
      waypoints: [[72.84,18.94],[75,15],[76,12],[78,9],[79.85,6.92]],
      distanceNm: 920,
      etaHours: 52,
    },
    safeRoute: {
      id: "safe-bom-cmb-southern",
      label: "Mumbai -> Southern detour -> Colombo",
      waypoints: [[72.84,18.94],[73,16],[73.5,12],[75,9],[77,7.5],[79.85,6.92]],
      distanceNm: 1140,
      etaHours: 64,
    },
  },
  {
    id: "hou-sg-panama",
    chokepointId: "panama_canal",
    originLabel: "Houston",
    destLabel: "Singapore",
    originCoords: [-95.26, 29.73],
    destCoords: [103.85, 1.29],
    cameraZoom: 1.5,
    cameraCenter: [10, 8],
    complianceProfileIds: ["india_eez_east", "india_eez_west"],
    directRoute: {
      id: "direct-hou-sg-panama",
      label: "Houston -> Panama -> Malacca -> Singapore",
      waypoints: [[-95.26,29.73],[-79.6,9.1],[-120,5],[-170,0],[150,2],[120,5],[103.85,1.29]],
      distanceNm: 10500,
      etaHours: 584,
    },
    safeRoute: {
      id: "safe-hou-sg-cape",
      label: "Houston -> Cape -> Indian Ocean -> Singapore",
      waypoints: [[-95.26,29.73],[-74.01,40.71],[-30,35],[-5,36],[32.5,30],[45,12.5],[65,11.5],[88,7],[103.85,1.29]],
      distanceNm: 12800,
      etaHours: 711,
    },
  },
  {
    id: "rtm-sg-suez",
    chokepointId: "bab_el_mandeb",
    originLabel: "Rotterdam",
    destLabel: "Singapore",
    originCoords: [4.14, 51.95],
    destCoords: [103.85, 1.29],
    cameraZoom: 2.2,
    cameraCenter: [50, 25],
    complianceProfileIds: [
      "eu_north_sea",
      "eu_mediterranean",
      "india_eez_west",
    ],
    directRoute: {
      id: "direct-rtm-sg-suez",
      label: "Rotterdam -> Suez -> Singapore",
      waypoints: [[4.14,51.95],[2,50],[-5,45],[-5.5,36],[25,35],[32.5,30],[38,20],[43.5,12.5],[65,11.5],[80,6],[99.5,4.5],[103.85,1.29]],
      distanceNm: 8440,
      etaHours: 624,
    },
    safeRoute: {
      id: "safe-rtm-sg-cape",
      label: "Rotterdam -> Cape of Good Hope -> Singapore",
      waypoints: [[4.14,51.95],[2,50],[-5,36],[-5,15],[-15,-30],[0,-35],[18.5,-34.2],[45,-25],[70,-18],[90,-10],[103.85,1.29]],
      distanceNm: 11780,
      etaHours: 888,
    },
  },
  {
    id: "yok-rtm-suez",
    chokepointId: "bab_el_mandeb",
    originLabel: "Yokohama",
    destLabel: "Rotterdam",
    originCoords: [139.63, 35.45],
    destCoords: [4.14, 51.95],
    cameraZoom: 2.0,
    cameraCenter: [72, 24],
    complianceProfileIds: [
      "india_eez_east",
      "india_eez_west",
      "eu_mediterranean",
      "eu_north_sea",
    ],
    directRoute: {
      id: "direct-yok-rtm-suez",
      label: "Yokohama -> Malacca -> Suez -> Rotterdam",
      waypoints: [[139.63,35.45],[130,31],[122,29],[112,12],[103.85,1.29],[99.5,4.5],[88,7],[76,8],[65,11.5],[43.5,12.5],[32.5,30],[-5.5,36],[2,50],[4.14,51.95]],
      distanceNm: 9800,
      etaHours: 544,
    },
    safeRoute: {
      id: "safe-yok-rtm-cape",
      label: "Yokohama -> Cape -> Rotterdam",
      waypoints: [[139.63,35.45],[130,20],[112,-4],[100,-8],[80,-15],[55,-20],[18.5,-34.2],[0,-35],[-15,-30],[-5,36],[2,50],[4.14,51.95]],
      distanceNm: 13400,
      etaHours: 744,
    },
  },
];

export const ROUTE_LOOKUP_BY_CHOKEPOINT: Record<string, LookupEntry> =
  Object.fromEntries(ROUTE_LOOKUP.map((e) => [e.chokepointId, e]));

export interface ChokepointMeta {
  id: string;
  label: string;
  region: string;
  defaultZoneIds: string[];
  statusTemplate: (severity: number) => string;
  transitDelayHours: (severity: number) => number;
}

export const CHOKEPOINT_META: Record<string, ChokepointMeta> = {
  open_ocean: {
    id: "open_ocean",
    label: "Open Ocean Transit",
    region: "Global",
    defaultZoneIds: [],
    statusTemplate: (s) =>
      `No mapped high-risk corridor intersects the direct route. Severity ${s} reflects normal operational caution.`,
    transitDelayHours: () => 0,
  },
  bab_el_mandeb: {
    id: "bab_el_mandeb",
    label: "Bab-el-Mandeb (Red Sea)",
    region: "Red Sea",
    defaultZoneIds: [
      "bab_el_mandeb_core",
      "red_sea_north",
      "gulf_of_aden_corridor",
    ],
    statusTemplate: (s) =>
      s >= 4
        ? `Active anti-ship missile and drone operations. Severity ${s}. War-risk premiums 10× baseline.`
        : `Elevated threat environment. Severity ${s}. Armed groups active in corridor.`,
    transitDelayHours: (s) => s * 18,
  },
  hormuz: {
    id: "hormuz",
    label: "Strait of Hormuz",
    region: "Persian Gulf",
    defaultZoneIds: ["hormuz_strait", "persian_gulf_inner"],
    statusTemplate: (s) =>
      `IRGCN vessel seizure operations. Severity ${s}. ${
        s >= 3
          ? "4 vessels detained in 72-hr window."
          : "Elevated boarding risk."
      }`,
    transitDelayHours: (s) => s * 12,
  },
  malacca: {
    id: "malacca",
    label: "Strait of Malacca",
    region: "Southeast Asia",
    defaultZoneIds: ["malacca_piracy"],
    statusTemplate: (s) =>
      `IMB piracy advisory. Severity ${s}. ${s * 3} incidents in rolling 30-day window.`,
    transitDelayHours: (s) => s * 6,
  },
  arabian_sea_cyclone: {
    id: "arabian_sea_cyclone",
    label: "Arabian Sea (Cyclone)",
    region: "Arabian Sea",
    defaultZoneIds: ["cyclone_hamoon_track", "cyclone_outer_bands"],
    statusTemplate: (s) =>
      `Category ${s} cyclone. Max sustained winds ${s * 22} kt. BOM advisory active. 48-hr projected track covers primary shipping lane.`,
    transitDelayHours: (s) => s * 24,
  },
  turkish_straits: {
    id: "turkish_straits",
    label: "Turkish Straits (Bosphorus)",
    region: "Black Sea",
    defaultZoneIds: ["bosphorus_congestion", "black_sea_conflict"],
    statusTemplate: (s) =>
      `Mandatory TSS pilotage. Severity ${s}. ${Math.round(s * 1.8)}-day average wait.${
        s >= 4 ? " Black Sea conflict zone active." : ""
      }`,
    transitDelayHours: (s) => s * 36,
  },
  luzon: {
    id: "luzon",
    label: "Luzon Strait",
    region: "Western Pacific",
    defaultZoneIds: [
      "luzon_strait_typhoon",
      "south_china_sea_dispute",
      "taiwan_strait_tension",
    ],
    statusTemplate: (s) =>
      `Geopolitical tension and typhoon risk. Severity ${s}. PLA exercises with periodic exclusion zones.`,
    transitDelayHours: (s) => s * 10,
  },
  cape_of_good_hope: {
    id: "cape_of_good_hope",
    label: "Cape of Good Hope",
    region: "Southern Africa",
    defaultZoneIds: ["cape_storm_corridor"],
    statusTemplate: (s) =>
      `Southern Ocean storm system. Severity ${s}. Sustained 40-kt winds. ${s * 1.5}m average swell.`,
    transitDelayHours: (s) => s * 8,
  },
  panama_canal: {
    id: "panama_canal",
    label: "Panama Canal",
    region: "Central America",
    defaultZoneIds: ["panama_canal_drought"],
    statusTemplate: (s) =>
      `Panama Canal draft and slot restrictions. Severity ${s}. Queueing and water-level constraints active.`,
    transitDelayHours: (s) => s * 10,
  },
};

export const CHOKEPOINT_OPTIONS = Object.values(CHOKEPOINT_META).map((m) => ({
  value: m.id,
  label: m.label,
}));
