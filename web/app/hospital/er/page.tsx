"use client";
import { useState } from "react";
import { Search, AlertCircle, Activity, Heart, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ERTriageBoard() {
  const [lookup, setLookup] = useState("");
  const router = useRouter();

  const handleLookup = () => {
    router.push("/hospital/er/f135b91a-1286-455b-bb68-ec7b4f53ec38");
  };

  return (
    <div className="p-8 h-screen bg-slate-900 text-white flex flex-col">
      <header className="flex justify-between items-center mb-8 shrink-0">
        <div>
          <h1 className="text-3xl font-black text-red-500 tracking-tight flex items-center gap-3">
            <Activity className="w-8 h-8" /> EMERGENCY TRIAGE
          </h1>
          <p className="text-slate-400 mt-1">Live Board • Kaveri Hospital ER</p>
        </div>
        
        <div className="bg-slate-800 p-2 rounded-xl flex items-center gap-2 w-96 border border-slate-700 focus-within:border-red-500 transition">
          <Search className="w-5 h-5 text-slate-400 ml-2" />
          <input 
            type="text" 
            value={lookup}
            onChange={(e) => setLookup(e.target.value)}
            placeholder="Break-glass lookup: ABHA or Phone..."
            className="bg-transparent border-none outline-none text-white w-full placeholder-slate-500 font-mono"
            onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
          />
        </div>
      </header>

      <div className="flex-1 grid grid-cols-3 gap-6">
        <div className="bg-slate-800 rounded-2xl border-t-4 border-t-red-500 flex flex-col overflow-hidden">
          <div className="p-4 bg-slate-800/50 border-b border-slate-700 text-center font-bold text-red-500 tracking-wider">PRIORITY 1 - RESUSCITATION</div>
          <div className="flex-1 p-4 space-y-3 overflow-y-auto">
            <div className="text-center text-slate-600 mt-10">No active P1 arrivals</div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-2xl border-t-4 border-t-amber-500 flex flex-col overflow-hidden">
          <div className="p-4 bg-slate-800/50 border-b border-slate-700 text-center font-bold text-amber-500 tracking-wider">PRIORITY 2 - URGENT</div>
          <div className="flex-1 p-4 space-y-3 overflow-y-auto">
            <div className="bg-slate-700/50 p-4 rounded-xl border border-slate-600 cursor-pointer hover:bg-slate-700 transition" onClick={handleLookup}>
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-lg">Priya Sharma</h3>
                <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded font-bold">12m</span>
              </div>
              <p className="text-sm text-slate-400 mt-1">47F • Chest Pain, Diaphoresis</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs font-bold text-red-400">BP: 160/100</span>
                <span className="flex items-center text-xs text-blue-400">Open Chart <ArrowRight className="w-3 h-3 ml-1"/></span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-2xl border-t-4 border-t-emerald-500 flex flex-col overflow-hidden">
          <div className="p-4 bg-slate-800/50 border-b border-slate-700 text-center font-bold text-emerald-500 tracking-wider">PRIORITY 3 - LESS URGENT</div>
          <div className="flex-1 p-4 space-y-3 overflow-y-auto">
            <div className="text-center text-slate-600 mt-10">3 active P3 patients</div>
          </div>
        </div>
      </div>
    </div>
  );
}
