"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Cpu,
  MessageSquareText,
  RotateCw,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBridgeStore } from "@/lib/store";
import { useOrchestratorStream } from "@/lib/hooks/useOrchestratorStream";
import { ToolCallRow } from "./ToolCallRow";

export function AgentPanel() {
  const phase = useBridgeStore((s) => s.phase);
  const agent = useBridgeStore((s) => s.agent);
  const scenarioId = useBridgeStore((s) => s.scenarioId);
  const startStream = useOrchestratorStream();

  const visible =
    phase === "assessing" ||
    phase === "decision" ||
    phase === "accepted" ||
    phase === "dismissed" ||
    agent.status === "error";

  const [mounted, setMounted] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(visible));
    return () => cancelAnimationFrame(id);
  }, [visible]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [agent.toolCalls.length, agent.rationaleDraft, agent.status]);

  if (!visible) return null;

  const status = agent.status;
  const statusPill =
    status === "thinking" ? (
      <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-cyan-300">
        <span className="size-1.5 rounded-full bg-cyan-400 animate-pulse" />
        Thinking
      </span>
    ) : status === "done" ? (
      <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-emerald-300">
        <span className="size-1.5 rounded-full bg-emerald-400" />
        Done
      </span>
    ) : status === "writing" ? (
      <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-amber-300">
        <span className="size-1.5 rounded-full bg-amber-300 animate-pulse" />
        Writing
      </span>
    ) : status === "error" ? (
      <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-rose-300">
        <span className="size-1.5 rounded-full bg-rose-400" />
        Error
      </span>
    ) : null;

  const hideOnMobile = phase === "decision";

  return (
    <div
      className={`absolute right-0 bottom-0 left-0 sm:left-auto top-1/2 sm:top-0 w-full sm:w-[420px] z-20 transition-transform duration-300 ease-out ${
        mounted ? "translate-y-0 sm:translate-x-0" : "translate-y-full sm:translate-y-0 sm:translate-x-full"
      } ${hideOnMobile ? "hidden sm:block" : ""}`}
    >
      <div className="h-full flex flex-col bg-slate-900/95 backdrop-blur-sm border-t sm:border-t-0 sm:border-l border-slate-800 shadow-2xl">
        <div className="h-12 shrink-0 px-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Cpu className="size-4 text-cyan-400" />
            <span className="text-[11px] uppercase tracking-[0.15em] font-semibold text-slate-200">
              Local-first Copilot
            </span>
          </div>
          {statusPill}
        </div>

        {phase === "accepted" && (
          <div className="shrink-0 px-4 py-2 bg-emerald-500/10 border-b border-emerald-500/30 text-emerald-300 text-[11px] uppercase tracking-[0.15em] font-semibold flex items-center gap-2">
            <CheckCircle2 className="size-3.5" /> Accepted · course logged
          </div>
        )}
        {phase === "dismissed" && (
          <div className="shrink-0 px-4 py-2 bg-slate-800/40 border-b border-slate-700/60 text-slate-400 text-[11px] uppercase tracking-[0.15em] font-semibold flex items-center gap-2">
            <XCircle className="size-3.5" /> Dismissed
          </div>
        )}

        {agent.error && (
          <div className="shrink-0 mx-4 my-3 rounded-md bg-rose-500/10 border border-rose-500/40 p-3 flex items-start gap-2.5">
            <AlertTriangle className="size-4 text-rose-300 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-[0.15em] font-semibold text-rose-300">
                Orchestrator error
              </div>
              <div className="mt-0.5 text-[13px] text-rose-100 leading-snug">
                {agent.error}
              </div>
              <div className="mt-2.5">
                <Button
                  size="sm"
                  onClick={() => startStream(scenarioId)}
                  className="h-7 gap-1.5 bg-rose-500 hover:bg-rose-400 text-slate-950 font-semibold"
                >
                  <RotateCw className="size-3" />
                  Retry
                </Button>
              </div>
            </div>
          </div>
        )}

        <div ref={listRef} className="flex-1 overflow-y-auto">
          {agent.toolCalls.length === 0 && status === "thinking" && (
            <div className="px-4 py-3 text-[12px] text-slate-500 italic">
              Calling tools…
            </div>
          )}
          {agent.toolCalls.map((tc, i) => (
            <ToolCallRow key={`${tc.name}-${i}`} tc={tc} index={i} />
          ))}
          {(agent.rationaleDraft || agent.status === "writing") && (
            <div className="mx-4 my-3 rounded-md border border-slate-700/70 bg-slate-950/40 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] font-semibold text-slate-400">
                  <MessageSquareText className="size-3.5 text-amber-300" />
                  Captain rationale
                </div>
                {agent.status === "writing" && (
                  <span className="text-[10px] uppercase tracking-[0.15em] text-amber-300">
                    Streaming
                  </span>
                )}
              </div>
              {agent.rationaleFallbackMessage && (
                <div className="mt-2 rounded border border-amber-500/20 bg-amber-500/5 px-2.5 py-1.5 text-[11px] leading-snug text-amber-200/80">
                  {agent.rationaleFallbackMessage}
                </div>
              )}
              <p className="mt-2 min-h-12 whitespace-pre-wrap text-[13px] leading-relaxed text-slate-200">
                {agent.rationaleDraft}
                {agent.status === "writing" && (
                  <span className="ml-0.5 inline-block h-3 w-1 translate-y-0.5 animate-pulse bg-amber-300" />
                )}
              </p>
            </div>
          )}
          {status === "thinking" && (
            <div className="px-4 py-3 flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-cyan-400 animate-bounce" />
              <span className="size-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.15s]" />
              <span className="size-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.3s]" />
              <span className="ml-2 text-[11px] uppercase tracking-[0.15em] text-slate-500">
                Calling tools
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
