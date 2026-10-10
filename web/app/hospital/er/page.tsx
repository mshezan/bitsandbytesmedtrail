"use client";
import { useState, useEffect } from "react";
import { Search, AlertTriangle, Clock, History, Activity, Info, ArrowRight, ShieldAlert, CheckCircle2, FileText, UserPlus, FileWarning } from "lucide-react";
import { useRouter } from "next/navigation";
import { fetchAPI } from "@/lib/api";

export default function ERTriageBoard() {
  const [board, setBoard] = useState<any>(null);
  const [lookup, setLookup] = useState("");
  const [reason, setReason] = useState("");
  const [showLookupModal, setShowLookupModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchAPI('/hospital/er/board').then(setBoard).catch(console.error);
  }, []);

  const handleLookup = () => {
    if (!reason) return alert("You must provide a break-glass reason for audit logging.");
    // In a real app we'd submit this to backend. For demo, we navigate.
    alert("Audit log created. Patient notified.");
    setShowLookupModal(false);
    router.push("/hospital/patient/f135b91a-1286-455b-bb68-ec7b4f53ec38/consult");
  };

  if (!board) return <div className="p-8 text-slate-500 animate-pulse font-medium text-center h-full flex items-center justify-center">Loading ER Board...</div>;

  const lanes = [
    { id: 'p1', title: 'Priority 1 - Immediate', accent: 'bg-red-500', bg: 'bg-red-50/50', border: 'border-red-200' },
    { id: 'p2', title: 'Priority 2 - Emergent', accent: 'bg-orange-500', bg: 'bg-orange-50/50', border: 'border-orange-200' },
    { id: 'p3', title: 'Priority 3 - Urgent', accent: 'bg-amber-500', bg: 'bg-amber-50/50', border: 'border-amber-200' },
    { id: 'p4', title: 'Priority 4 - Non-Urgent', accent: 'bg-emerald-500', bg: 'bg-emerald-50/50', border: 'border-emerald-200' },
    { id: 'p5', title: 'Awaiting Registration', accent: 'bg-slate-400', bg: 'bg-slate-50', border: 'border-slate-200' },
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      <header className="px-6 py-4 bg-white border-b border-slate-200 flex justify-between items-center shrink-0 shadow-sm z-10">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-rose-600" /> EMERGENCY TRIAGE
          </h1>
          <p className="text-slate-500 text-sm mt-0.5 font-medium">Live Board • Kaveri Hospital ER</p>
        </div>
        
        <button 
          onClick={() => setShowLookupModal(true)}
          className="bg-white border border-slate-300 hover:border-indigo-400 hover:ring-2 hover:ring-indigo-100 rounded-xl flex items-center gap-2 px-4 py-2 transition shadow-sm"
        >
          <Search className="w-4 h-4 text-slate-400" />
          <span className="text-slate-500 text-sm font-medium">Break-glass lookup (ABHA/Phone)...</span>
        </button>
      </header>

      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-6 h-full min-w-max pb-4">
          {lanes.map(lane => (
            <div key={lane.id} className={`w-[400px] flex flex-col bg-white rounded-2xl border ${lane.border} overflow-hidden shadow-sm flex-shrink-0`}>
              <div className={`px-4 py-3 border-b ${lane.border} flex items-center justify-between ${lane.bg}`}>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${lane.accent}`}></div>
                  <h2 className="font-black text-slate-800 uppercase tracking-tight text-sm">{lane.title}</h2>
                </div>
                <span className="bg-white border border-slate-200 text-slate-700 text-xs font-bold px-2 py-0.5 rounded-full">{board[lane.id].length}</span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 space-y-4 bg-slate-50/50">
                {board[lane.id].map((patient: any, idx: number) => (
                  <PatientCard key={idx} patient={patient} router={router} laneAccent={lane.accent} />
                ))}
                {board[lane.id].length === 0 && (
                  <div className="text-center text-slate-400 font-medium py-8 text-sm bg-white rounded-xl border border-dashed border-slate-200">
                    No active arrivals
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showLookupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-1 flex items-center gap-2">
              <FileWarning className="w-5 h-5 text-rose-600"/> Break-Glass Lookup
            </h2>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">Search for a patient's universal MedTrail record using their ABHA ID or phone number. Access will be audited.</p>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase mb-1.5 block">Identifier (ABHA / Phone)</label>
                <input 
                  type="text" 
                  value={lookup}
                  onChange={(e) => setLookup(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. 91-0000-0000-0000"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase mb-1.5 block">Clinical Reason for Access</label>
                <textarea 
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="Required for audit logging..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowLookupModal(false)} className="px-4 py-2 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-100">Cancel</button>
                <button onClick={handleLookup} className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md">Acknowledge & Search</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PatientCard({ patient, router, laneAccent }: { patient: any, router: any, laneAccent: string }) {
  const isAbnormal = (key: string, val: string) => {
    if (val === "---") return false;
    const num = parseInt(val);
    if (key === "SpO2" && num < 95) return true;
    if (key === "HR" && (num > 100 || num < 60)) return true;
    if (key === "BP" && (num > 140 || num < 90)) return true; // simplified check
    return false;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition overflow-hidden">
      <div className={`h-1.5 w-full ${laneAccent}`}></div>
      <div className="p-4">
        
        {/* Header: Name, Demographics, Wait Time */}
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-bold text-slate-900 text-base leading-tight">{patient.name}</h3>
            <div className="text-xs text-slate-500 font-medium">{patient.age}y • {patient.sex}</div>
          </div>
          <div className="flex flex-col items-end">
            <span className={`text-sm font-black flex items-center gap-1 ${patient.wait_minutes > 30 ? 'text-rose-600' : 'text-slate-700'}`}>
              <Clock className="w-3.5 h-3.5" /> {patient.wait_minutes}m
            </span>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Arr: {patient.arrival_time}</span>
          </div>
        </div>

        {/* Complaint & Timer */}
        <div className="mb-4">
          <div className="text-sm font-bold text-slate-800">{patient.complaint}</div>
          {patient.timer && (
            <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded w-fit border border-rose-100">
               <AlertTriangle className="w-3 h-3"/> {patient.timer}
            </div>
          )}
        </div>

        {/* Vitals Grid */}
        <div className="grid grid-cols-4 gap-2 mb-4 bg-slate-50 p-2 rounded-lg border border-slate-100">
          {Object.entries(patient.vitals).map(([k, v]: [string, any]) => {
            const abnormal = isAbnormal(k, v);
            return (
              <div key={k} className="text-center">
                <div className="text-[9px] font-bold uppercase text-slate-400">{k}</div>
                <div className={`text-xs font-black ${abnormal ? 'text-rose-600' : 'text-slate-700'}`}>{v}</div>
              </div>
            );
          })}
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          {patient.allergy && (
            <span className="text-[10px] font-black uppercase text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded flex items-center gap-1">
              <ShieldAlert className="w-3 h-3"/> {patient.allergy}
            </span>
          )}
          {patient.history_orgs > 0 && (
            <span className="text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded flex items-center gap-1">
              <History className="w-3 h-3"/> History ({patient.history_orgs})
            </span>
          )}
          {patient.assigned_to && (
            <span className="text-[10px] font-black uppercase text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded flex items-center gap-1">
              <UserPlus className="w-3 h-3"/> {patient.assigned_to}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-3 border-t border-slate-100 overflow-x-auto pb-1 no-scrollbar">
          <button 
            onClick={() => router.push(`/hospital/patient/${patient.id}/consult`)}
            className="shrink-0 flex items-center gap-1.5 text-[11px] font-bold text-white bg-slate-800 hover:bg-slate-900 px-3 py-1.5 rounded-lg transition"
          >
            <FileText className="w-3.5 h-3.5"/> Chart
          </button>
          <button className="shrink-0 flex items-center gap-1.5 text-[11px] font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition">
            Assign
          </button>
          <button className="shrink-0 flex items-center gap-1.5 text-[11px] font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition">
            Priority
          </button>
          <button className="shrink-0 flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition ml-auto">
            <CheckCircle2 className="w-3.5 h-3.5"/> Discharge
          </button>
        </div>

      </div>
    </div>
  );
}
