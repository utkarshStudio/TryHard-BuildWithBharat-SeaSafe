"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { useBridgeStore } from "@/lib/store";
import { DEFAULT_SCENARIO_ID, SCENARIOS_BY_ID } from "@/lib/scenarios";
import type { Decision, ToolCall } from "@/lib/types";

const NETWORK_LOST = "Connection lost. Reconnect and retry.";
const GENERIC_ERROR = "Couldn't reach the orchestrator. Retry.";

type OrchestratorEvent =
  | { type: "tool_call"; name: string; args: Record<string, string> }
  | {
      type: "tool_result";
      name: string;
      args: Record<string, unknown>;
      result: unknown;
      durationMs: number;
    }
  | { type: "rationale_start" }
  | { type: "rationale_delta"; delta: string }
  | { type: "rationale_fallback"; message: string; rationale: string }
  | { type: "final"; output: Decision }
  | { type: "error"; message: string };

export function useOrchestratorStream() {
  return useCallback(async (scenarioId: string) => {
    const state = useBridgeStore.getState();
    const customScenario = state.customScenarios.find(
      (c) => c.id === scenarioId,
    );

    if (!SCENARIOS_BY_ID[scenarioId] && !customScenario) {
      toast.error("Scenario not found", {
        description: `Reset to ${SCENARIOS_BY_ID[DEFAULT_SCENARIO_ID].label}.`,
      });
      useBridgeStore.getState().loadScenario(DEFAULT_SCENARIO_ID);
      return;
    }

    const {
      startAssess,
      pushToolCall,
      startAgentRationale,
      appendAgentRationale,
      setAgentRationaleFallback,
      setAgentOutput,
      setAgentError,
    } = useBridgeStore.getState();

    startAssess();
    const ctrl = new AbortController();

    try {
      const requestBody = { scenario: useBridgeStore.getState().scenario };
      const res = await fetch("/api/orchestrator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        setAgentError(GENERIC_ERROR);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        let value: Uint8Array | undefined;
        let done = false;
        try {
          const r = await reader.read();
          value = r.value;
          done = r.done;
        } catch (e) {
          if ((e as { name?: string }).name === "AbortError") return;
          setAgentError(NETWORK_LOST);
          return;
        }
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const chunks = buf.split("\n\n");
        buf = chunks.pop() ?? "";

        for (const chunk of chunks) {
          const line = chunk.trim();
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (data === "[DONE]") return;

          try {
            const ev = JSON.parse(data) as OrchestratorEvent;

            if (ev.type === "tool_result") {
              const tc: ToolCall = {
                name: ev.name,
                args: ev.args,
                result: ev.result,
                durationMs: ev.durationMs,
              };
              pushToolCall(tc);
            } else if (ev.type === "rationale_start") {
              startAgentRationale();
            } else if (ev.type === "rationale_delta") {
              appendAgentRationale(ev.delta);
            } else if (ev.type === "rationale_fallback") {
              setAgentRationaleFallback(ev.rationale, ev.message);
            } else if (ev.type === "final") {
              setAgentOutput(ev.output);
            } else if (ev.type === "error") {
              if (/unknown scenarioid/i.test(ev.message)) {
                toast.error("Scenario not found", {
                  description: `Reset to ${SCENARIOS_BY_ID[DEFAULT_SCENARIO_ID].label}.`,
                });
                useBridgeStore.getState().loadScenario(DEFAULT_SCENARIO_ID);
              } else {
                setAgentError(ev.message || GENERIC_ERROR);
              }
              return;
            }
          } catch {
            // ignore malformed partial frames
          }
        }
      }
    } catch (e) {
      const err = e as { name?: string; message?: string };
      if (err.name === "AbortError") return;
      if (err.name === "TypeError" || /failed to fetch/i.test(err.message ?? "")) {
        setAgentError(NETWORK_LOST);
      } else {
        setAgentError(err.message || GENERIC_ERROR);
      }
    }
  }, []);
}
