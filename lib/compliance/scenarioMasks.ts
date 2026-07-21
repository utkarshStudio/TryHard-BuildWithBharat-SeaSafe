import type { Scenario } from "@/lib/types";
import {
  COMPLIANCE_ZONE_BY_ID,
  type ComplianceProfile,
} from "@/lib/compliance/zones";

export interface ScenarioComplianceProfile {
  scenarioId: string;
  /** Which compliance zones the primary route passes through, in order. */
  zonesEncountered: string[];
  /** Plain-English summary for the HUD header. */
  summary: string;
  /** The strictest applicable profile encountered on the route. */
  strictestProfile: ComplianceProfile;
}

const STRICTNESS: Record<ComplianceProfile, number> = {
  international_imo: 0,
  india_dpdp: 2,
  eu_gdpr: 3,
  gulf_uae_fdpl: 3,
};

export const SCENARIO_COMPLIANCE_PROFILES: ScenarioComplianceProfile[] = [
  {
    scenarioId: "red-sea",
    zonesEncountered: ["india_eez_west", "eu_mediterranean", "eu_north_sea"],
    summary:
      "Route transits Indian EEZ (DPDP Act sec. 8(7)) then EU Mediterranean and North Sea waters (GDPR Art. 5). Route masking active in three jurisdictions.",
    strictestProfile: "eu_gdpr",
  },
  {
    scenarioId: "hormuz",
    zonesEncountered: ["india_eez_west", "uae_gulf_of_oman"],
    summary:
      "Route approaches UAE waters via Gulf of Oman (UAE FDPL Art. 6/14). 80 nm look-ahead, 12 h disposal within UAE jurisdiction.",
    strictestProfile: "gulf_uae_fdpl",
  },
  {
    scenarioId: "panama",
    zonesEncountered: ["india_eez_east", "eu_mediterranean"],
    summary:
      "Suez-routed vessels transit the eastern Bay of Bengal (DPDP Act) and briefly enter EU Mediterranean waters (GDPR) near the Suez approach.",
    strictestProfile: "india_dpdp",
  },
  {
    scenarioId: "malacca",
    zonesEncountered: ["india_eez_west", "india_territorial"],
    summary:
      "Destination Mumbai. Final approach through Indian EEZ and territorial waters. DPDP Act sec. 8(7) + SPDI Rules active.",
    strictestProfile: "india_dpdp",
  },
  {
    scenarioId: "cyclone",
    zonesEncountered: ["india_eez_west", "india_territorial"],
    summary:
      "Origin Mumbai, with the route inside or adjacent to India's western EEZ. DPDP masking applies for the voyage.",
    strictestProfile: "india_dpdp",
  },
];

export function strictestProfileForZones(zoneIds: string[]): ComplianceProfile {
  return zoneIds.reduce<ComplianceProfile>((strictest, zoneId) => {
    const profile = COMPLIANCE_ZONE_BY_ID[zoneId]?.profile;
    if (!profile) return strictest;
    return STRICTNESS[profile] > STRICTNESS[strictest] ? profile : strictest;
  }, "international_imo");
}

export function getScenarioComplianceProfile(
  scenario: Pick<Scenario, "id" | "label" | "complianceProfileIds">,
): ScenarioComplianceProfile | null {
  const canned = SCENARIO_COMPLIANCE_PROFILES.find(
    (profile) => profile.scenarioId === scenario.id,
  );
  if (canned) return canned;

  const zoneIds = scenario.complianceProfileIds ?? [];
  if (zoneIds.length === 0) return null;

  return {
    scenarioId: scenario.id,
    zonesEncountered: zoneIds,
    summary: `${scenario.label} intersects ${zoneIds.length} regulated data zone${
      zoneIds.length === 1 ? "" : "s"
    }. Route masking uses the strictest active jurisdiction at the vessel position.`,
    strictestProfile: strictestProfileForZones(zoneIds),
  };
}
