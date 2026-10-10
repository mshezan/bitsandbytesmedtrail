"use client";

import { useState } from "react";
import { fetchAPI } from "@/lib/api";
import { 
  Play, RotateCcw, AlertTriangle, CheckCircle2, ChevronRight, Activity, X, Zap
} from "lucide-react";

export default function DemoControlPanel() {
  const [trace, setTrace] = useState<any[]>([]);
  const [activeMessage, setActiveMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const triggerScenario = async (action: string) => {
    setLoading(true);
    setTrace([]);
    setActiveMessage("Simulating network transmission...");
    
    try {
      const res = await fetchAPI(`/demo/trigger/${action}`, { method: "POST" });
      setActiveMessage(res.message);
      
      // Simulate real-time trace progression
      let currentTrace: any[] = [];
      for (const step of res.trace) {
        currentTrace.push(step);
        setTrace([...currentTrace]);
        await new Promise(r => setTimeout(r, 600)); // 600ms per stage visual delay
      }
    } catch (e) {
      setActiveMessage("Failed to trigger scenario");
    } finally {
      setLoading(false);
    }
  };

  const resetDemo = async () => {
    setLoading(true);
    setActiveMessage("Initiating full cluster database rebuild...");
    setTrace([]);
    await fetchAPI("/demo/reset", { method: "POST" });
    setTimeout(() => {
      setActiveMessage("Demo Cluster Restored to Ground Truth.");
      setLoading(false);
    }, 5000);
  };

  const scenarios = [
    { id: "metro_hba1c", title: "Metro Diagnostics publishes Priya's HbA1c", desc: "CSV drop -> Map -> Auto-Merge -> Live Toast" },
    { id: "sunrise_adt", title: "Sunrise ADT admission for Ramesh", desc: "HL7 MLLP -> Normalization -> New Encounter" },
    { id: "carefirst_conflict", title: "CareFirst dispenses conflicting drug", desc: "JSON Push -> Identity Match -> Interaction Alert" },
    { id: "near_duplicate", title: "New near-duplicate patient arrives", desc: "Ambiguous Match -> Link Review Queue" },
    { id: "break_greenfield", title: "Break Greenfield's Feed", desc: "Simulate Connection Timeout -> DLQ" }
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 flex flex-col font-sans">
      {/* Header */}
      <div className="bg-slate-950 p-6 border-b border-slate-800 flex justify-between items-center shadow-lg">
        <div>
          <h1 className="text-2xl font-bold text-emerald-400 flex items-center gap-3">
            <Zap className="w-6 h-6 text-emerald-400 fill-emerald-400" />
            Live Demo Control Panel
          </h1>
          <p className="text-sm text-slate-500 mt-1">MedTrail Integration Hub Orchestrator</p>
        </div>
        <button 
          onClick={resetDemo}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-rose-900/30 text-rose-400 border border-rose-800 rounded-lg hover:bg-rose-900/50 transition font-bold text-sm"
        >
          <RotateCcw className="w-4 h-4" /> Reset Demo DB
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Scenarios */}
        <div className="w-1/2 p-8 border-r border-slate-800 overflow-y-auto">
          <h2 className="text-lg font-bold text-slate-300 mb-6 uppercase tracking-wider text-xs">Story Mode Scenarios</h2>
          
          <div className="space-y-4">
            {scenarios.map((s, idx) => (
              <button 
                key={s.id}
                onClick={() => triggerScenario(s.id)}
                disabled={loading}
                className="w-full text-left bg-slate-800/50 hover:bg-slate-800 border border-slate-700 p-5 rounded-xl transition group flex items-start justify-between"
              >
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="bg-emerald-900 text-emerald-400 font-bold px-2 py-0.5 rounded text-xs">Step {idx+1}</span>
                    <h3 className="font-bold text-slate-200 text-base">{s.title}</h3>
                  </div>
                  <p className="text-sm text-slate-400">{s.desc}</p>
                </div>
                <Play className="w-6 h-6 text-slate-600 group-hover:text-emerald-400 transition" />
              </button>
            ))}
          </div>
        </div>

        {/* Right: Pipeline Trace */}
        <div className="w-1/2 bg-slate-950 p-8 flex flex-col relative">
          <h2 className="text-lg font-bold text-slate-300 mb-6 uppercase tracking-wider text-xs">Live Pipeline Trace</h2>
          
          {activeMessage ? (
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-2xl flex-1 flex flex-col">
              <h3 className="text-xl font-bold text-emerald-400 mb-8 border-b border-slate-800 pb-4">{activeMessage}</h3>
              
              <div className="space-y-6">
                {trace.map((step, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="mt-1">
                      {step.status === "success" ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> :
                       step.status === "error" ? <X className="w-6 h-6 text-rose-500" /> :
                       step.status === "review_required" ? <AlertTriangle className="w-6 h-6 text-amber-500" /> :
                       <Activity className="w-6 h-6 text-slate-500 animate-pulse" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-200 text-sm">{step.stage}</h4>
                      <p className={`text-sm mt-1 font-mono ${step.status === 'success' ? 'text-slate-400' : step.status === 'error' ? 'text-rose-400' : 'text-amber-400'}`}>
                        {step.msg || "Processing..."}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-800 rounded-xl text-slate-600 font-bold">
              Waiting for network events...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
