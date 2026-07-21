// Maritime Data Compliance Zones - SeaSafe Prompt 9
//
// Each zone encodes the jurisdiction, governing law citations, masking window,
// and disposal deadline for positional/route data collected within it. These are
// intentionally separate from danger zones: a danger zone is an operational risk,
// while a compliance zone is a legal data-lifecycle boundary.

export type ComplianceProfile =
  | "india_dpdp"
  | "eu_gdpr"
  | "gulf_uae_fdpl"
  | "international_imo";

export interface ComplianceZone {
  id: string;
  label: string;
  profile: ComplianceProfile;
  /** Simplified bounding box: [west, south, east, north] in decimal degrees. */
  bbox: [number, number, number, number];
  /** How far ahead (nm) of current vessel position to display the route. */
  lookAheadNm: number;
  /** Maximum hours traversed segment data may remain in memory before disposal. */
  disposalHours: number;
  /** One-line legal basis shown in the Compliance HUD. */
  legalBasis: string;
  /** HUD accent color matching the jurisdiction overlay. */
  hudColor: string;
}

export const INTERNATIONAL_COMPLIANCE_DEFAULT = {
  profile: "international_imo" as ComplianceProfile,
  lookAheadNm: 200,
  disposalHours: 48,
  legalBasis:
    "SOLAS V/19 + IMO MSC-FAL.1/Circ.3 - 200 nm forward display; no retained historical track.",
};

export const COMPLIANCE_ZONES: ComplianceZone[] = [
  // INDIA - DPDP ACT 2023 + IT ACT SPDI RULES
  //
  // Legal basis: India's Digital Personal Data Protection Act, 2023 received
  // Presidential assent on 11 August 2023. Section 8(7) imposes storage
  // limitation: personal data should be erased once consent is withdrawn or the
  // specified purpose is no longer being served, subject to legal retention
  // duties. Section 16 governs processing of personal data outside India. The
  // 2011 SPDI Rules under the Information Technology Act, 2000 reinforce
  // purpose limitation and retention controls for sensitive personal data.
  //
  // SeaSafe interpretation: a route segment's navigation purpose ends when the
  // vessel has sailed past it. Where vessel identity, watch schedules, master
  // identity, or crew context are linked to position records, the route history
  // can identify natural persons operationally associated with the ship. The
  // demo therefore displays only upcoming route geometry inside Indian waters,
  // masks traversed waypoints, and models disposal within the prompt's 24 h
  // operating rule. Territorial waters use a stricter 1 h disposal posture.
  {
    id: "india_eez_west",
    label: "Indian EEZ - Arabian Sea",
    profile: "india_dpdp",
    bbox: [60.0, 6.0, 78.0, 24.0],
    lookAheadNm: 150,
    disposalHours: 24,
    legalBasis:
      "DPDP Act 2023 sec. 8(7) - retain only for navigation purpose; dispose within 24 h of segment transit.",
    hudColor: "text-orange-400",
  },
  {
    id: "india_eez_east",
    label: "Indian EEZ - Bay of Bengal",
    profile: "india_dpdp",
    bbox: [78.0, 5.0, 95.0, 22.0],
    lookAheadNm: 150,
    disposalHours: 24,
    legalBasis:
      "DPDP Act 2023 sec. 8(7) - retain only for navigation purpose; dispose within 24 h of segment transit.",
    hudColor: "text-orange-400",
  },
  {
    id: "india_territorial",
    label: "Indian Territorial Waters (12 nm)",
    profile: "india_dpdp",
    // Prompt 9 models territorial-water handling at port approaches rather
    // than the whole EEZ. Keep this box tight around India's western port
    // approach so Mumbai classifies as territorial while offshore Arabian Sea
    // cyclone routing remains under the 150 nm EEZ window.
    bbox: [68.0, 16.5, 74.2, 23.5],
    lookAheadNm: 80,
    disposalHours: 1,
    legalBasis:
      "DPDP Act 2023 sec. 16 + IT Act SPDI Rules 2011 - territorial sea: immediate masking, 1 h disposal.",
    hudColor: "text-red-400",
  },

  // EUROPEAN UNION - GDPR + NIS2
  //
  // Legal basis: GDPR Article 5(1)(b) requires purpose limitation and Article
  // 5(1)(e) requires storage limitation. Article 25 requires data protection by
  // design and by default. NIS2 Directive (EU) 2022/2555 Article 21 requires
  // cybersecurity risk-management measures for essential entities, including
  // transport operators, and explicitly covers protection of data assets.
  //
  // SeaSafe interpretation: a complete historic route tied to a named vessel,
  // IMO number, and operational decision log can constitute personal or
  // security-sensitive data. A forward-only route display satisfies navigation
  // purpose while minimizing retained history. Inside EU waters the display
  // window tightens to 100 nm and history is removed as soon as it exits the
  // navigation window.
  {
    id: "eu_mediterranean",
    label: "EU Waters - Mediterranean",
    profile: "eu_gdpr",
    bbox: [-6.0, 30.0, 36.5, 46.0],
    lookAheadNm: 100,
    disposalHours: 0,
    legalBasis:
      "GDPR Art. 5(1)(e) storage limitation + Art. 25 privacy by design - no historical track retention.",
    hudColor: "text-blue-400",
  },
  {
    id: "eu_north_sea",
    label: "EU Waters - North Sea / English Channel",
    profile: "eu_gdpr",
    bbox: [-5.0, 48.5, 10.0, 58.0],
    lookAheadNm: 100,
    disposalHours: 0,
    legalBasis:
      "GDPR Art. 5(1)(e) + NIS2 Art. 21 - maritime transport: data minimisation and cyber risk management.",
    hudColor: "text-blue-400",
  },

  // GULF / UAE - FDPL + SAUDI PDPL
  //
  // Legal basis: UAE Federal Decree-Law No. 45 of 2021 on the Protection of
  // Personal Data provides data minimisation controls and restricts cross-border
  // transfer absent an adequate protection basis. Saudi Arabia's Personal Data
  // Protection Law Article 29 likewise restricts cross-border transfers unless
  // equivalent safeguards or competent-authority exceptions apply.
  //
  // SeaSafe interpretation: the Hormuz demo operates around UAE terminals and
  // Gulf routing lanes where vessel, crew, and terminal data are tightly linked.
  // The geography is constrained, so an 80 nm window is operationally sufficient
  // and reduces unnecessary retention. Traversed segments are modeled as
  // disposed within 12 h.
  {
    id: "uae_gulf",
    label: "UAE/Gulf Jurisdiction - Persian Gulf",
    profile: "gulf_uae_fdpl",
    bbox: [48.0, 22.0, 57.5, 27.5],
    lookAheadNm: 80,
    disposalHours: 12,
    legalBasis:
      "UAE FDPL Art. 6/14 + Saudi PDPL Art. 29 - minimisation and restricted cross-border transfer.",
    hudColor: "text-yellow-400",
  },
  {
    id: "uae_gulf_of_oman",
    label: "UAE/Oman Jurisdiction - Gulf of Oman",
    profile: "gulf_uae_fdpl",
    bbox: [55.5, 22.0, 60.5, 26.5],
    lookAheadNm: 80,
    disposalHours: 12,
    legalBasis:
      "UAE FDPL Art. 6/14 - applies to UAE registered terminals and connected route processing.",
    hudColor: "text-yellow-400",
  },
];

export const COMPLIANCE_ZONE_BY_ID: Record<string, ComplianceZone> =
  Object.fromEntries(COMPLIANCE_ZONES.map((zone) => [zone.id, zone]));

export function findComplianceZones(
  lng: number,
  lat: number,
): ComplianceZone[] {
  return COMPLIANCE_ZONES.filter(
    (zone) =>
      lng >= zone.bbox[0] &&
      lng <= zone.bbox[2] &&
      lat >= zone.bbox[1] &&
      lat <= zone.bbox[3],
  );
}

export function classifyWaypoint(
  lng: number,
  lat: number,
): ComplianceZone | null {
  const matching = findComplianceZones(lng, lat);
  if (matching.length === 0) return null;

  return matching.reduce((current, candidate) => {
    if (candidate.lookAheadNm !== current.lookAheadNm) {
      return candidate.lookAheadNm < current.lookAheadNm
        ? candidate
        : current;
    }
    return candidate.disposalHours < current.disposalHours
      ? candidate
      : current;
  });
}

export function bboxToPolygon(
  [west, south, east, north]: [number, number, number, number],
): [number, number][] {
  return [
    [west, south],
    [east, south],
    [east, north],
    [west, north],
  ];
}
