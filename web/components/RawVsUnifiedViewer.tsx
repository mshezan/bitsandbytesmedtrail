"use client";

import { X, ArrowRight, Database, FileJson, CheckCircle2 } from "lucide-react";

export default function RawVsUnifiedViewer({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Data Sync Trace</h2>
            <p className="text-xs text-slate-500 mt-1">Viewing transformation provenance for record ID: e2a-4b92-881c</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left: Raw */}
          <div className="w-1/2 border-r border-slate-200 flex flex-col bg-slate-900 text-slate-300">
            <div className="px-4 py-2 border-b border-slate-700 bg-slate-800 flex items-center gap-2">
              <Database className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-slate-200 uppercase">Original Record (Metro Diagnostics)</span>
              <span className="ml-auto text-[10px] font-mono bg-slate-700 px-2 rounded text-slate-400">CSV Export</span>
            </div>
            <div className="p-6 font-mono text-sm overflow-auto leading-relaxed">
              <span className="text-slate-500">mrn,name,test_name,value,date</span><br/>
              <span className="text-amber-400 font-bold bg-amber-400/10 px-1">MD-111</span>,
              <span className="text-slate-200">Priya S.</span>,
              <span className="text-rose-400 font-bold bg-rose-400/10 px-1">Glycosylated Hb</span>,
              <span className="text-emerald-400 font-bold bg-emerald-400/10 px-1">7.8%</span>,
              <span className="text-blue-400 font-bold bg-blue-400/10 px-1">19/09/2026</span>
            </div>
          </div>

          {/* Center: Arrows */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-12 pointer-events-none">
            <div className="bg-white rounded-full p-2 shadow-lg border border-slate-200"><ArrowRight className="w-6 h-6 text-slate-400" /></div>
          </div>

          {/* Right: Unified */}
          <div className="w-1/2 flex flex-col bg-white">
            <div className="px-4 py-2 border-b border-slate-200 bg-emerald-50 flex items-center gap-2">
              <FileJson className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-800 uppercase">Unified MedTrail Record</span>
              <span className="ml-auto text-[10px] font-mono bg-emerald-200/50 text-emerald-700 px-2 rounded">FHIR R4</span>
            </div>
            <div className="p-6 font-mono text-sm overflow-auto text-slate-700 leading-loose">
              {"{"}<br/>
              &nbsp;&nbsp;"resourceType": "Observation",<br/>
              &nbsp;&nbsp;"subject": {"{"} "reference": "Patient/<span className="text-amber-600 font-bold bg-amber-100 px-1">ab82-991f</span>" {"}"}, <span className="text-xs text-slate-400 italic"> // Identity resolved via ABHA</span><br/>
              &nbsp;&nbsp;"code": {"{"}<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;"coding": [{"{"} "system": "http://loinc.org", "code": "<span className="text-rose-600 font-bold bg-rose-100 px-1">4548-4</span>", "display": "<span className="text-rose-600 font-bold bg-rose-100 px-1">HbA1c</span>" {"}"}] <span className="text-xs text-slate-400 italic"> // Terminology Mapped</span><br/>
              &nbsp;&nbsp;{"}"},<br/>
              &nbsp;&nbsp;"valueQuantity": {"{"}<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;"value": <span className="text-emerald-600 font-bold bg-emerald-100 px-1">7.8</span>,<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;"unit": "<span className="text-emerald-600 font-bold bg-emerald-100 px-1">%</span>"<br/>
              &nbsp;&nbsp;{"}"},<br/>
              &nbsp;&nbsp;"effectiveDateTime": "<span className="text-blue-600 font-bold bg-blue-100 px-1">2026-09-19T00:00:00Z</span>" <span className="text-xs text-slate-400 italic"> // ISO-8601 Normalized</span><br/>
              {"}"}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between">
          <div className="flex gap-4 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-500"/> Validation Passed</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-500"/> Terminology Mapped</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-500"/> Deduplicated</span>
          </div>
          <button onClick={onClose} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-sm rounded-lg">Close Trace</button>
        </div>
      </div>
    </div>
  );
}
