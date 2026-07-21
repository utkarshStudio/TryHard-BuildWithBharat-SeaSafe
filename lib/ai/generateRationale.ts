import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { llama } from "@/lib/ai/llama";
import type { Decision, Scenario, ToolCall } from "@/lib/types";

export const LLAMA_MODEL = "llama3.2:3b";
export const LOCAL_AI_TIMEOUT_MS = 4000;

const SYSTEM_PROMPT = `You are SeaSafe, a maritime bridge decision copilot assisting a ship captain during operational disruptions.

Rules:

* Use concise operational maritime language.
* Never invent numerical values.
* Never invent weather data.
* Never generate routes.
* Never calculate metrics yourself.
* Only use the supplied tool outputs.
* Speak like a bridge officer or fleet operations analyst.
* Be calm, precise, and decision-oriented.
* Avoid marketing language.
* Avoid dramatic wording.
* Avoid emojis.
* Maximum 2 short paragraphs.
* Keep each paragraph under 55 words.
* Mention tradeoffs clearly.
* Explicitly state the recommended route.
* If risk is severe, prioritize crew and vessel safety over cost efficiency.`;

interface RationaleRoute {
  id: string;
  label: string;
}

interface RationaleToolResults {
  deterministicDecision: {
    recommendedRoute: RationaleRoute;
    alternativeRoutes: [RationaleRoute, RationaleRoute];
    headline: string;
  };
  toolCalls: ToolCall[];
}

interface GenerateRationaleInput {
  scenario: Scenario;
  toolCalls: ToolCall[];
  deterministicDecision: Decision;
}

export class LocalRationaleUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LocalRationaleUnavailableError";
  }
}

let warmupPromise: Promise<void> | null = null;
let hasWarmed = false;

export function warmLlamaOnce(): Promise<void> {
  if (hasWarmed) return Promise.resolve();
  if (warmupPromise) return warmupPromise;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LOCAL_AI_TIMEOUT_MS);

  warmupPromise = llama.chat.completions
    .create(
      {
        model: LLAMA_MODEL,
        messages: [
          {
            role: "user",
            content: "warmup",
          },
        ],
      },
      { signal: controller.signal },
    )
    .then(() => {
      hasWarmed = true;
    })
    .catch((error: unknown) => {
      warmupPromise = null;
      throw error;
    })
    .finally(() => {
      clearTimeout(timeout);
    });

  return warmupPromise;
}

export async function* generateRationale({
  scenario,
  toolCalls,
  deterministicDecision,
}: GenerateRationaleInput): AsyncGenerator<string> {
  const controller = new AbortController();
  const stopWatchdog = createWatchdog(() => controller.abort());

  try {
    const messages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: buildUserPrompt(
          scenario,
          buildToolResults(scenario, toolCalls, deterministicDecision),
        ),
      },
    ];

    const stream = await llama.chat.completions.create(
      {
        model: LLAMA_MODEL,
        stream: true,
        temperature: 0.3,
        max_tokens: 160,
        messages,
      },
      { signal: controller.signal },
    );

    for await (const chunk of stream) {
      stopWatchdog.reset();
      const token = chunk.choices[0]?.delta?.content;
      if (token) yield token;
    }
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Local rationale generation failed.";
    throw new LocalRationaleUnavailableError(message);
  } finally {
    stopWatchdog.clear();
  }
}

export function normalizeGeneratedRationale(
  generated: string,
  fallback: string,
): string {
  const normalized = generated
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return normalized.length > 0 ? normalized : fallback;
}

function buildToolResults(
  scenario: Scenario,
  toolCalls: ToolCall[],
  deterministicDecision: Decision,
): RationaleToolResults {
  return {
    deterministicDecision: {
      recommendedRoute: routeReference(
        scenario,
        deterministicDecision.recommendedRouteId,
      ),
      alternativeRoutes: [
        routeReference(scenario, deterministicDecision.alternativeRouteIds[0]),
        routeReference(scenario, deterministicDecision.alternativeRouteIds[1]),
      ],
      headline: deterministicDecision.headline,
    },
    toolCalls,
  };
}

function routeReference(scenario: Scenario, routeId: string): RationaleRoute {
  const route = scenario.routes.find((candidate) => candidate.id === routeId);
  return {
    id: routeId,
    label: route?.label ?? routeId,
  };
}

function buildUserPrompt(
  scenario: Scenario,
  toolResults: RationaleToolResults,
): string {
  return `Scenario:
${scenario.label}

Vessel:
${scenario.vessel.name}

Chokepoint:
${scenario.chokepoint.name}

Tool outputs:
${JSON.stringify(toolResults, null, 2)}

Write a concise captain-facing operational recommendation.`;
}

function createWatchdog(onTimeout: () => void) {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const clear = () => {
    if (!timer) return;
    clearTimeout(timer);
    timer = null;
  };

  const reset = () => {
    clear();
    timer = setTimeout(onTimeout, LOCAL_AI_TIMEOUT_MS);
  };

  reset();

  return { clear, reset };
}
