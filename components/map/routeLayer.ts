import { PathLayer } from "@deck.gl/layers";
import type { Route } from "@/lib/types";

export type RouteLayerOptions = {
  width?: number;
  pickable?: boolean;
  id?: string;
  /**
   * Extra value mixed into updateTriggers so deck.gl re-renders the layer
   * when colour/width depend on something other than route identity.
   */
  trigger?: string | number;
  pathTrigger?: string | number;
};

export function buildRouteLayer(
  route: Route,
  colorRgba: [number, number, number, number],
  opts: RouteLayerOptions = {},
) {
  const id = opts.id ?? `route-${route.id}`;
  const width = opts.width ?? 4;
  const triggerKey = `${route.id}|${colorRgba.join(",")}|${width}|${opts.trigger ?? ""}`;

  return new PathLayer<Route>({
    id,
    data: [route],
    getPath: (d) => d.waypoints,
    getColor: () => colorRgba,
    getWidth: width,
    widthUnits: "pixels",
    capRounded: true,
    jointRounded: true,
    pickable: opts.pickable ?? false,
    updateTriggers: {
      getPath: `${route.id}|${opts.pathTrigger ?? ""}`,
      getColor: triggerKey,
      getWidth: triggerKey,
    },
  });
}
