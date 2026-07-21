"use client";

import { RADAR_AXES, type RouteRadarScores } from "@/lib/radar/scores";

const COLORS = {
  gridLine: "rgba(71, 85, 105, 0.5)",
  gridLineFill: "rgba(15, 23, 42, 0.6)",
  axisLine: "rgba(71, 85, 105, 0.8)",
  axisLabel: "rgba(148, 163, 184, 1)",

  recommended: "rgba(16, 185, 129, 0.85)",
  altA: "rgba(99, 179, 237, 0.75)",
  altB: "rgba(239, 68, 68, 0.55)",

  recommendedFill: "rgba(16, 185, 129, 0.12)",
  altAFill: "rgba(99, 179, 237, 0.08)",
  altBFill: "rgba(239, 68, 68, 0.06)",

  selectedStroke: "rgba(251, 191, 36, 1)",
  selectedFill: "rgba(251, 191, 36, 0.15)",

  dotSelected: "rgba(251, 191, 36, 1)",
  dotDefault: "rgba(71, 85, 105, 1)",
} as const;

const LEGEND_HEX = {
  recommended: "#10B981",
  altA: "#63B3ED",
  altB: "#EF4444",
} as const;

const CHART_SIZE = 260;
const CENTER = 130;
const RADIUS = 95;
const RING_COUNT = 4;
const AXIS_COUNT = 5;
const LABEL_OFFSET = 16;

function polar(
  cx: number,
  cy: number,
  r: number,
  angleRad: number,
): [number, number] {
  return [cx + r * Math.sin(angleRad), cy - r * Math.cos(angleRad)];
}

const toR = (score: number) => score * RADIUS;

function buildPolygon(scores: number[], cx: number, cy: number): string {
  return scores
    .map((s, i) => {
      const angle = (2 * Math.PI * i) / AXIS_COUNT;
      const [x, y] = polar(cx, cy, toR(s), angle);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

function buildRingPolygon(fraction: number, cx: number, cy: number): string {
  const r = fraction * RADIUS;
  return Array.from({ length: AXIS_COUNT }, (_, i) => {
    const angle = (2 * Math.PI * i) / AXIS_COUNT;
    const [x, y] = polar(cx, cy, r, angle);
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(" ");
}

function vertexPoints(
  scores: number[],
  cx: number,
  cy: number,
): [number, number][] {
  return scores.map((s, i) => {
    const angle = (2 * Math.PI * i) / AXIS_COUNT;
    return polar(cx, cy, toR(s), angle);
  });
}

const AXIS_ANCHOR: ("middle" | "start" | "end")[] = [
  "middle",
  "start",
  "start",
  "end",
  "end",
];

const AXIS_DY = ["-4", "0", "0", "0", "0"];

function truncate(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

interface RouteRadarChartProps {
  routeScores: RouteRadarScores[];
  selectedRouteId: string | null;
  onRouteClick?: (routeId: string) => void;
  recommendedRouteId?: string | null;
  alternativeRouteIds?: readonly [string, string] | null;
}

export function RouteRadarChart({
  routeScores,
  selectedRouteId,
  onRouteClick,
  recommendedRouteId,
  alternativeRouteIds,
}: RouteRadarChartProps) {
  if (routeScores.length === 0) return null;

  const recId = recommendedRouteId ?? routeScores[0].routeId;
  const altAId = alternativeRouteIds?.[0] ?? routeScores[1]?.routeId ?? null;
  const altBId = alternativeRouteIds?.[1] ?? routeScores[2]?.routeId ?? null;

  const colorFor = (
    routeId: string,
  ): { stroke: string; fill: string; legendHex: string; glowId: string } => {
    if (routeId === recId)
      return {
        stroke: COLORS.recommended,
        fill: COLORS.recommendedFill,
        legendHex: LEGEND_HEX.recommended,
        glowId: "radar-glow-emerald",
      };
    if (routeId === altAId)
      return {
        stroke: COLORS.altA,
        fill: COLORS.altAFill,
        legendHex: LEGEND_HEX.altA,
        glowId: "radar-glow-sky",
      };
    return {
      stroke: COLORS.altB,
      fill: COLORS.altBFill,
      legendHex: LEGEND_HEX.altB,
      glowId: "radar-glow-amber",
    };
  };

  const ordered = [
    routeScores.find((r) => r.routeId === altBId),
    routeScores.find((r) => r.routeId === altAId),
    routeScores.find((r) => r.routeId === recId),
  ].filter((r): r is RouteRadarScores => r != null);

  const someSelected = selectedRouteId != null;

  const ringFractions = Array.from(
    { length: RING_COUNT },
    (_, i) => (i + 1) / RING_COUNT,
  );

  const axisLabel = (i: number) => {
    const angle = (2 * Math.PI * i) / AXIS_COUNT;
    return polar(CENTER, CENTER, RADIUS + LABEL_OFFSET, angle);
  };

  const ariaSummary = routeScores
    .map((r) => `${r.label}`)
    .join(", ");

  return (
    <div className="w-full">
      <style>{`
        @keyframes radar-in {
          from { transform: scale(0); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }
      `}</style>
      <svg
        viewBox={`0 0 ${CHART_SIZE} ${CHART_SIZE}`}
        width="100%"
        role="img"
        aria-label={`Route comparison radar chart: ${ariaSummary}`}
        style={{ display: "block", maxHeight: 260 }}
      >
        <defs>
          <filter
            id="radar-glow-emerald"
            x="-30%"
            y="-30%"
            width="160%"
            height="160%"
          >
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter
            id="radar-glow-sky"
            x="-30%"
            y="-30%"
            width="160%"
            height="160%"
          >
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter
            id="radar-glow-amber"
            x="-30%"
            y="-30%"
            width="160%"
            height="160%"
          >
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {ringFractions.map((fraction, i) => (
          <polygon
            key={`ring-${i}`}
            points={buildRingPolygon(fraction, CENTER, CENTER)}
            fill={i === 0 ? COLORS.gridLineFill : "none"}
            stroke={COLORS.gridLine}
            strokeWidth={0.75}
            strokeLinejoin="round"
          />
        ))}

        {Array.from({ length: AXIS_COUNT }, (_, i) => {
          const angle = (2 * Math.PI * i) / AXIS_COUNT;
          const [x, y] = polar(CENTER, CENTER, RADIUS, angle);
          return (
            <line
              key={`spoke-${i}`}
              x1={CENTER}
              y1={CENTER}
              x2={x}
              y2={y}
              stroke={COLORS.axisLine}
              strokeWidth={0.75}
            />
          );
        })}

        {RADAR_AXES.map((label, i) => {
          const [lx, ly] = axisLabel(i);
          return (
            <text
              key={`label-${i}`}
              x={lx}
              y={ly}
              dy={AXIS_DY[i]}
              textAnchor={AXIS_ANCHOR[i]}
              fill={COLORS.axisLabel}
              fontFamily="Inter, sans-serif"
              fontSize="8"
              fontWeight="600"
              letterSpacing="0.08em"
              dominantBaseline="middle"
            >
              {label}
            </text>
          );
        })}

        <g
          style={{
            transformOrigin: `${CENTER}px ${CENTER}px`,
            animation:
              "radar-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both",
          }}
        >
          {ordered.map((route) => {
            const c = colorFor(route.routeId);
            const isSelected = route.routeId === selectedRouteId;
            const dimmed = someSelected && !isSelected;
            const stroke = isSelected ? COLORS.selectedStroke : c.stroke;
            const fill = isSelected ? COLORS.selectedFill : c.fill;
            const opacity = dimmed ? 0.4 : 1;
            const filter = isSelected ? "url(#radar-glow-amber)" : undefined;

            const scoreReadout = route.scores
              .map(
                (s, i) =>
                  `${RADAR_AXES[i]}: ${Math.round(s * 100)}`,
              )
              .join(", ");

            return (
              <g
                key={`poly-${route.routeId}`}
                style={{ transition: "opacity 0.2s ease-out" }}
                opacity={opacity}
              >
                <polygon
                  points={buildPolygon(route.scores, CENTER, CENTER)}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={isSelected ? 2 : 1.5}
                  strokeLinejoin="round"
                  filter={filter}
                  style={{
                    cursor: onRouteClick ? "pointer" : "default",
                    transition: "all 0.2s ease-out",
                  }}
                  onClick={() => onRouteClick?.(route.routeId)}
                  aria-label={`${route.label} — ${scoreReadout}`}
                />
                {vertexPoints(route.scores, CENTER, CENTER).map(
                  ([x, y], vi) => (
                    <circle
                      key={`v-${route.routeId}-${vi}`}
                      cx={x}
                      cy={y}
                      r={isSelected ? 3.5 : 2.5}
                      fill={isSelected ? COLORS.dotSelected : COLORS.dotDefault}
                      stroke="none"
                      style={{
                        cursor: onRouteClick ? "pointer" : "default",
                        transition: "all 0.2s ease-out",
                      }}
                      onClick={() => onRouteClick?.(route.routeId)}
                    />
                  ),
                )}
              </g>
            );
          })}
        </g>
      </svg>

      <div className="flex items-center justify-center flex-wrap gap-4 mt-2">
        {routeScores.map((r) => {
          const c = colorFor(r.routeId);
          const isSelected = r.routeId === selectedRouteId;
          return (
            <button
              key={`legend-${r.routeId}`}
              type="button"
              onClick={() => onRouteClick?.(r.routeId)}
              className="flex items-center gap-1.5 text-[10px] tracking-wide uppercase transition-opacity duration-150"
              style={{ opacity: isSelected || !someSelected ? 1 : 0.55 }}
            >
              <span
                className="inline-block w-5 h-0.5 rounded-full"
                style={{
                  backgroundColor: c.legendHex,
                  boxShadow: isSelected
                    ? `0 0 6px ${c.legendHex}`
                    : "none",
                }}
              />
              <span
                className="font-medium"
                style={{
                  color: isSelected ? "#F1F5F9" : "#94A3B8",
                }}
              >
                {truncate(r.label, 22)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
