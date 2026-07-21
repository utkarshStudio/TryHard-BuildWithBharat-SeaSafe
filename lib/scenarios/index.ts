import redSea from "./red-sea.json";
import hormuz from "./hormuz.json";
import panama from "./panama.json";
import malacca from "./malacca.json";
import cyclone from "./cyclone.json";
import type { Scenario } from "@/lib/types";

export const SCENARIOS: Scenario[] = [
  redSea,
  hormuz,
  panama,
  malacca,
  cyclone,
] as unknown as Scenario[];

export const SCENARIOS_BY_ID: Record<string, Scenario> = Object.fromEntries(
  SCENARIOS.map((s) => [s.id, s]),
);

export const DEFAULT_SCENARIO_ID = "red-sea";

export function getScenario(id: string): Scenario | undefined {
  return SCENARIOS_BY_ID[id];
}
