"use client";

import { useBridgeStore } from "@/lib/store";
import { SCENARIOS } from "@/lib/scenarios";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ScenarioPicker() {
  const scenarioId = useBridgeStore((s) => s.scenarioId);
  const loadScenario = useBridgeStore((s) => s.loadScenario);
  const customScenarios = useBridgeStore((s) => s.customScenarios);

  const allScenarios = [...SCENARIOS, ...customScenarios];
  const current = allScenarios.find((s) => s.id === scenarioId);

  return (
    <Select value={scenarioId} onValueChange={(v) => v && loadScenario(v)}>
      <SelectTrigger className="w-[160px] sm:w-[300px] bg-slate-900/80 border-slate-700 text-slate-100">
        <SelectValue>
          <span className="hidden sm:inline text-[10px] uppercase tracking-[0.15em] text-slate-400 mr-2">
            Scenario
          </span>
          <span className="font-medium truncate block sm:inline">{current?.label}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-slate-900 border-slate-700 text-slate-100">
        {SCENARIOS.map((s) => (
          <SelectItem key={s.id} value={s.id} className="py-2">
            <div className="flex flex-col">
              <span className="font-medium text-slate-100">{s.label}</span>
              <span className="text-[11px] text-slate-400">{s.flavor}</span>
            </div>
          </SelectItem>
        ))}
        {customScenarios.length > 0 && (
          <div className="px-2 pt-1.5 pb-0.5 text-[9px] uppercase tracking-widest text-slate-500 border-t border-slate-800 mt-1">
            Custom
          </div>
        )}
        {customScenarios.map((s) => (
          <SelectItem key={s.id} value={s.id} className="py-2">
            <div className="flex flex-col">
              <span className="font-medium text-slate-100">{s.label}</span>
              <span className="text-[11px] text-amber-400">{s.flavor}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
