export type WeatherHazardType = "cyclone" | "storm" | "rain" | "swell" | "wind";

export interface WeatherHazardZone {
  id: string;
  type: WeatherHazardType;
  severity: 1 | 2 | 3 | 4 | 5;
  label: string;
  center: [number, number];
  polygon: [number, number][];
  movement?: {
    directionDeg: number;
    speedKts: number;
  };
  metadata: {
    windSpeedKts?: number;
    waveHeightM?: number;
    rainfallMm?: number;
    pressureMb?: number;
  };
  updatedAt: string;
}

export type WeatherSourceStatus =
  | "idle"
  | "loading"
  | "live"
  | "fallback"
  | "unavailable";

export interface WeatherViewportBounds {
  west: number;
  south: number;
  east: number;
  north: number;
}

export interface WeatherRouteAssessment {
  hazardous: boolean;
  intersectingHazards: WeatherHazardZone[];
  maxSeverity: number;
  hazardousRouteId?: string;
  recommendedRouteId?: string;
  projectedImpactHours: number;
  recommendation: string;
  source: WeatherSourceStatus;
  updatedAt: string;
}

export interface WeatherFetchResult {
  hazards: WeatherHazardZone[];
  status: WeatherSourceStatus;
  message?: string;
  updatedAt: string;
}
