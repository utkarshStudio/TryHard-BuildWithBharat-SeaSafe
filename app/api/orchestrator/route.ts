import { runTool, type ToolName } from "@/lib/tools/tools";
import { getScenario, DEFAULT_SCENARIO_ID } from "@/lib/scenarios";
import type { OrchestratorStep, Scenario, ToolCall } from "@/lib/types";
import {
  generateRationale,
  normalizeGeneratedRationale,
  warmLlamaOnce,
} from "@/lib/ai/generateRationale";
import { sleep } from "@/lib/utils";

export const runtime = "nodejs";

const LOCAL_AI_FALLBACK_MESSAGE =
  "Local AI unavailable — using deterministic advisory.";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    scenarioId?: string;
    scenario?: Scenario;
  };
  const scenarioId = body.scenarioId ?? body.scenario?.id ?? DEFAULT_SCENARIO_ID;
  const scenario: Scenario | undefined =
    body.scenario ?? getScenario(scenarioId);

  const encoder = new TextEncoder();
  let closed = false;
  void warmLlamaOnce().catch(() => undefined);
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(obj)}\n\n`),
          );
        } catch {
          closed = true;
        }
      };

      try {
        if (!scenario) {
          send({ type: "error", message: `Unknown scenarioId: ${scenarioId}` });
          return;
        }

        const toolCalls: ToolCall[] = [];

        for (const step of weatherFirstScript(scenario.orchestratorScript)) {
          await sleep(step.delayMsBefore);
          if (closed) return;
          send({ type: "tool_call", name: step.tool, args: step.args });

          const t0 = performance.now();
          let result: unknown;
          try {
            result = runTool(scenario, step.tool as ToolName, step.args);
          } catch (e) {
            result = { error: (e as Error).message };
          }
          const durationMs = Math.max(
            1,
            Math.round(performance.now() - t0),
          );

          await sleep(180);
          if (closed) return;
          const toolCall: ToolCall = {
            name: step.tool,
            args: step.args,
            result,
            durationMs,
          };
          toolCalls.push(toolCall);
          send({
            type: "tool_result",
            ...toolCall,
          });
        }

        await sleep(500);
        if (closed) return;
        send({ type: "rationale_start" });

        let rationale = "";
        try {
          for await (const token of generateRationale({
            scenario,
            toolCalls,
            deterministicDecision: scenario.decision,
          })) {
            if (closed) return;
            rationale += token;
            send({ type: "rationale_delta", delta: token });
          }

          if (rationale.trim().length === 0) {
            throw new Error("Local AI returned an empty advisory.");
          }

          send({
            type: "final",
            output: {
              ...scenario.decision,
              rationale: normalizeGeneratedRationale(
                rationale,
                scenario.decision.rationale,
              ),
            },
          });
        } catch {
          send({
            type: "rationale_fallback",
            message: LOCAL_AI_FALLBACK_MESSAGE,
            rationale: scenario.decision.rationale,
          });
          send({ type: "final", output: scenario.decision });
        }
      } catch (e) {
        send({
          type: "error",
          message: (e as Error).message ?? "Unknown orchestrator error",
        });
      } finally {
        if (!closed) {
          try {
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          } catch {
            // client gone
          }
          try {
            controller.close();
          } catch {
            // already closed
          }
        }
      }
    },

    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

function weatherFirstScript(script: OrchestratorStep[]): OrchestratorStep[] {
  const withoutWeather = script.filter(
    (step) => step.tool !== "check_weather_hazards",
  );
  return [
    { tool: "check_weather_hazards", args: {}, delayMsBefore: 520 },
    ...withoutWeather,
  ];
}
