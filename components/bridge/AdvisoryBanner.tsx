"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBridgeStore } from "@/lib/store";
import { useOrchestratorStream } from "@/lib/hooks/useOrchestratorStream";

export function AdvisoryBanner() {
  const phase = useBridgeStore((s) => s.phase);
  const advisory = useBridgeStore((s) => s.advisory);
  const chokepoint = useBridgeStore((s) => s.scenario.chokepoint);
  const scenarioId = useBridgeStore((s) => s.scenarioId);
  const dismiss = useBridgeStore((s) => s.dismiss);
  const startStream = useOrchestratorStream();

  const visible = phase === "advisory" && advisory != null;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(visible));
    return () => cancelAnimationFrame(id);
  }, [visible]);

  if (!visible) return null;

  const isWeatherAdvisory = advisory.id.startsWith("weather-");

  return (
    <div
      className={`absolute top-0 left-0 right-0 z-30 transition-transform duration-[400ms] ease-out ${
        mounted ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div
        className={`border-b backdrop-blur-sm shadow-lg ${
          isWeatherAdvisory
            ? "bg-slate-950/95 border-cyan-500/70"
            : "bg-amber-950/95 border-amber-500"
        }`}
      >
        <div className="px-3 sm:px-6 py-2.5 sm:py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <div className="flex items-start gap-3 sm:contents">
            <div className="relative flex-shrink-0 mt-0.5 sm:mt-0">
              <span
                className={`absolute inset-0 rounded-full animate-ping ${
                  isWeatherAdvisory ? "bg-cyan-400/30" : "bg-amber-500/40"
                }`}
              />
              <AlertTriangle
                className={`size-5 relative ${
                  isWeatherAdvisory ? "text-cyan-300" : "text-amber-300"
                }`}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div
                className={`text-[10px] uppercase tracking-[0.15em] font-semibold ${
                  isWeatherAdvisory ? "text-cyan-300" : "text-amber-300"
                }`}
              >
                {isWeatherAdvisory ? "Automated Weather Advisory" : "Advisory Received"}
              </div>
              <div className="text-[13px] sm:text-sm text-slate-100 leading-snug">
                <span className="font-medium text-white">{chokepoint.name}</span>
                <span className="mx-1.5 sm:mx-2 text-slate-500">·</span>
                <span className={isWeatherAdvisory ? "text-cyan-300" : "text-amber-300"}>
                  Severity {advisory.severity}
                </span>
                <span className="mx-1.5 sm:mx-2 text-slate-500 hidden sm:inline">·</span>
                <span className="block sm:inline mt-0.5 sm:mt-0 text-slate-200/90 line-clamp-2 sm:line-clamp-none">{advisory.summary}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 flex-shrink-0">
            <Button
              size="sm"
              onClick={() => startStream(scenarioId)}
              className={`h-8 font-semibold ${
                isWeatherAdvisory
                  ? "bg-cyan-400 hover:bg-cyan-300 text-slate-950"
                  : "bg-amber-500 hover:bg-amber-400 text-slate-900"
              }`}
            >
              Assess
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={dismiss}
              className="h-8 text-slate-300 hover:text-white hover:bg-slate-700/50"
            >
              <X className="size-3.5 mr-1" />
              Dismiss
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
