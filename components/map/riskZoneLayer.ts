import { PolygonLayer } from "@deck.gl/layers";
import type { Chokepoint } from "@/lib/types";

export function buildRiskZoneLayer(
  chokepoint: Chokepoint,
  active: boolean,
  pulseTick: number,
) {
  return new PolygonLayer<Chokepoint>({
    id: `risk-${chokepoint.id}`,
    data: [chokepoint],
    getPolygon: (d) => d.polygon,
    stroked: true,
    filled: true,
    getFillColor: () => [
      239,
      68,
      68,
      active ? 80 + Math.sin(pulseTick / 10) * 60 : 20,
    ],
    getLineColor: [239, 68, 68, 220],
    lineWidthUnits: "pixels",
    getLineWidth: 2,
    pickable: true,
    updateTriggers: {
      getFillColor: pulseTick,
    },
  });
}
