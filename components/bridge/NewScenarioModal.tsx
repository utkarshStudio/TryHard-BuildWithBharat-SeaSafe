"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Anchor } from "lucide-react";
import {
  buildCustomScenario,
  type CustomScenarioInput,
  type VesselTypeKey,
} from "@/lib/scenarioFactory";
import { useBridgeStore } from "@/lib/store";

const VESSEL_TYPES: { value: VesselTypeKey; label: string }[] = [
  { value: "container", label: "Container Ship" },
  { value: "tanker", label: "Tanker (VLCC/Aframax)" },
  { value: "bulk", label: "Bulk Carrier" },
  { value: "roro", label: "RoRo / Vehicle Carrier" },
  { value: "general_cargo", label: "General Cargo" },
];

interface Props {
  onClose: () => void;
}

export function NewScenarioModal({ onClose }: Props) {
  const pushCustomScenario = useBridgeStore((s) => s.pushCustomScenario);

  const [form, setForm] = useState<CustomScenarioInput>({
    vesselName: "",
    vesselType: "container",
    origin: "",
    destination: "",
    severity: 3,
  });
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState("");

  const [show, setShow] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let showFrame = 0;
    const mountFrame = requestAnimationFrame(() => {
      setMounted(true);
      showFrame = requestAnimationFrame(() => setShow(true));
    });
    return () => {
      cancelAnimationFrame(mountFrame);
      cancelAnimationFrame(showFrame);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  function set<K extends keyof CustomScenarioInput>(
    k: K,
    v: CustomScenarioInput[K],
  ) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function handleLaunch() {
    if (!form.vesselName.trim()) {
      setError("Vessel name is required.");
      return;
    }
    if (!form.origin.trim()) {
      setError("Origin port is required.");
      return;
    }
    if (!form.destination.trim()) {
      setError("Destination port is required.");
      return;
    }
    setError("");
    setBuilding(true);
    try {
      const scenario = buildCustomScenario(form);
      pushCustomScenario(scenario);
      onClose();
    } catch (e) {
      setError((e as Error).message ?? "Failed to build scenario");
      setBuilding(false);
    }
  }

  const severityClass =
    form.severity >= 4
      ? "text-red-400"
      : form.severity >= 3
        ? "text-amber-400"
        : "text-emerald-400";

  if (!mounted) return null;

  return createPortal(
    <div
      data-new-scenario-modal="true"
      className={`fixed inset-0 z-[9999] overflow-y-auto bg-black/70 backdrop-blur-sm transition-opacity duration-200 ${
        show ? "opacity-100" : "opacity-0"
      }`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="min-h-full flex items-start justify-center pt-20 sm:pt-36 pb-8 px-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div
          className={`w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-6 relative transition-all duration-200 ease-out ${
            show ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"
          }`}
        >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <Anchor size={16} className="text-emerald-400" />
          <h2 className="text-white font-semibold text-base tracking-wide">
            New Custom Scenario
          </h2>
        </div>
        <p className="text-slate-400 text-xs mb-5 leading-relaxed">
          Construct a live voyage. SeaSafe will compute routes, surface the
          danger zones it crosses, and run the full assessment.
        </p>

        <div className="space-y-4">
          <label className="block">
            <span className="text-slate-400 text-[10px] uppercase tracking-widest font-semibold">
              Vessel Name
            </span>
            <input
              type="text"
              placeholder="e.g. MV Argo Venture"
              value={form.vesselName}
              onChange={(e) => set("vesselName", e.target.value)}
              className="mt-1 w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </label>

          <label className="block">
            <span className="text-slate-400 text-[10px] uppercase tracking-widest font-semibold">
              Vessel Type
            </span>
            <select
              value={form.vesselType}
              onChange={(e) =>
                set("vesselType", e.target.value as VesselTypeKey)
              }
              className="mt-1 w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-amber-500 transition-colors"
            >
              {VESSEL_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-slate-400 text-[10px] uppercase tracking-widest font-semibold">
                Origin
              </span>
              <input
                type="text"
                placeholder="e.g. Shanghai"
                value={form.origin}
                onChange={(e) => set("origin", e.target.value)}
                className="mt-1 w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </label>
            <label className="block">
              <span className="text-slate-400 text-[10px] uppercase tracking-widest font-semibold">
                Destination
              </span>
              <input
                type="text"
                placeholder="e.g. Rotterdam"
                value={form.destination}
                onChange={(e) => set("destination", e.target.value)}
                className="mt-1 w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </label>
          </div>

          <label className="block">
            <div className="flex justify-between items-center mb-1">
              <span className="text-slate-400 text-[10px] uppercase tracking-widest font-semibold">
                Severity
              </span>
              <span
                className={`text-sm font-bold tabular-nums ${severityClass}`}
              >
                {form.severity} / 5
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={form.severity}
              onChange={(e) =>
                set(
                  "severity",
                  Number(e.target.value) as CustomScenarioInput["severity"],
                )
              }
              className="w-full accent-amber-500"
            />
            <div className="flex justify-between text-slate-600 text-[9px] mt-0.5 uppercase tracking-widest">
              <span>Low</span>
              <span>Mod</span>
              <span>High</span>
              <span>Sev</span>
              <span>Ext</span>
            </div>
          </label>
        </div>

        {error && (
          <p className="mt-3 text-red-400 text-xs bg-red-900/30 border border-red-800 rounded px-3 py-2">
            {error}
          </p>
        )}

        <div className="mt-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-md border border-slate-600 text-slate-400 text-sm hover:border-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleLaunch}
            disabled={building}
            className="flex-1 py-2 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {building ? "Building…" : "⚓ Launch Scenario"}
          </button>
        </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
