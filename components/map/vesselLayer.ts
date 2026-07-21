import { IconLayer, ScatterplotLayer } from "@deck.gl/layers";
import type { Vessel } from "@/lib/types";

const VESSEL_ICON_URL = "/icons/vessel.png";
let warned = false;

export type VesselIconStatus = "loading" | "available" | "missing";

function buildVesselHaloLayer(vessel: Vessel) {
  return new ScatterplotLayer<Vessel>({
    id: `vessel-halo-${vessel.id}`,
    data: [vessel],
    getPosition: (d) => d.position,
    getRadius: 14,
    radiusUnits: "pixels",
    getFillColor: [15, 23, 42, 220],
    getLineColor: [0, 0, 0, 255],
    lineWidthUnits: "pixels",
    getLineWidth: 2,
    stroked: true,
    pickable: false,
  });
}

export function buildVesselLayer(
  vessel: Vessel,
  iconStatus: VesselIconStatus,
) {
  if (iconStatus !== "available") {
    if (iconStatus === "missing" && !warned) {
      console.warn(
        `[seasafe] ${VESSEL_ICON_URL} not found, falling back to dot marker`,
      );
      warned = true;
    }
    return [
      new ScatterplotLayer<Vessel>({
        id: `vessel-fallback-${vessel.id}`,
        data: [vessel],
        getPosition: (d) => d.position,
        getRadius: 7,
        radiusUnits: "pixels",
        getFillColor: [255, 255, 255, 240],
        getLineColor: [0, 0, 0, 255],
        lineWidthUnits: "pixels",
        getLineWidth: 2.5,
        stroked: true,
        pickable: true,
      }),
    ];
  }

  return [
    buildVesselHaloLayer(vessel),
    new IconLayer<Vessel>({
      id: `vessel-icon-${vessel.id}`,
      data: [vessel],
      getPosition: (d) => d.position,
      getIcon: () => ({
        url: VESSEL_ICON_URL,
        width: 128,
        height: 128,
        anchorY: 64,
        anchorX: 64,
      }),
      sizeUnits: "pixels",
      getSize: 40,
      getAngle: (d) => -d.headingDeg,
      pickable: true,
    }),
  ];
}

export async function probeVesselIcon(): Promise<boolean> {
  try {
    const res = await fetch(VESSEL_ICON_URL, { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
}
