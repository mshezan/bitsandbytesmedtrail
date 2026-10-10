"use client";

import { useState, useEffect } from "react";
import { fetchAPI } from "@/lib/api";
import { AlertCircle, Lock, ShieldAlert, FileText, CheckCircle2 } from "lucide-react";

export default function PatientView({ params }: { params: { id: string } }) {
  const [patient, setPatient] = useState<any>(null);
  const [accessGranted, setAccessGranted] = useState(false);
  const [purpose, setPurpose] = useState("");

  const handleAccess = async (selectedPurpose: string) => {
    try {
      await fetchAPI(`/hospital/patient/${params.id}/access?purpose=${encodeURIComponent(selectedPurpose)}`, { method: "POST" });
      setPurpose(selectedPurpose);
      setAccessGranted(true);
      
      const data = await fetchAPI(`/hospital/patient/${params.id}`);
      setPatient(data);
    } catch (e) {
      alert("Failed to log access.");
    }
  };

  if (!accessGranted) {
    return (
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
          <div className="bg-blue-600 p-6 text-white text-center">
            <Lock className="w-12 h-12 mx-auto mb-4 opacity-80" />
            <h2 className="text-xl font-bold">Purpose of Access</h2>
            <p className="text-blue-100 text-sm mt-2">Under the DPDP Act, you must declare the purpose of accessing this medical record.</p>
          </div>
          <div className="p-6 space-y-3">
            {["OPD Consult", "Admission / IPD", "Emergency", "Lab / Diagnostic", "Follow-up"].map((p) => (
              <button
                key={p}
                onClick={() => handleAccess(p)}
                className="w-full text-left px-4 py-3 rounded-xl border border-slate-200 hover:border-blue-600 hover:bg-blue-50 font-medium text-slate-700 transition"
              >
                {p}
              </button>
            ))}
          </div>
          <div className="bg-slate-50 p-4 text-xs text-slate-500 text-center border-t border-slate-100">
            This action will be logged in the patient's Audit Trail and they will be notified.
          </div>
        </div>
      </div>
    );
  }

  if (!patient) return <div className="p-8">Loading...</div>;

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              {patient.name}
            </h1>
            <div className="text-slate-500 mt-2 flex items-center gap-4 text-sm">
              <span>ABHA: {patient.abha}</span>
              <span>•</span>
              <span>{patient.age}y</span>
              <span>•</span>
              <span className="text-red-600 font-bold flex items-center gap-1"><ShieldAlert className="w-4 h-4" /> Blood: {patient.blood_group || 'Unknown'}</span>
            </div>
          </div>
          <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Active Consent: {purpose}
          </div>
        </div>

        {/* Mock Tabs */}
        <div className="flex gap-6 border-b border-slate-200 mb-8">
          {["Summary", "Timeline", "Medications", "Labs", "Reports & Documents"].map((tab, i) => (
            <button key={tab} className={`pb-3 font-medium text-sm ${i === 0 ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Summary Content */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2"><AlertCircle className="w-4 h-4 text-red-500"/> Allergies</h3>
            <div className="flex flex-wrap gap-2">
              {patient.allergies.length > 0 ? patient.allergies.map((a: string, i: number) => (
                <span key={i} className="bg-red-50 text-red-700 border border-red-200 px-3 py-1 rounded-full text-sm font-medium">{a}</span>
              )) : <span className="text-slate-500 text-sm">No known allergies</span>}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Chronic Conditions</h3>
            <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
              {patient.conditions.length > 0 ? patient.conditions.map((c: string, i: number) => (
                <li key={i}>{c}</li>
              )) : <li className="text-slate-500">None documented</li>}
            </ul>
          </div>
          
          <div className="col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Active Medications</h3>
            <div className="space-y-3">
              {patient.medications.length > 0 ? patient.medications.map((m: string, i: number) => (
                <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="font-medium text-slate-800">{m}</span>
                  <span className="text-xs text-slate-500">Reconciled from unified record</span>
                </div>
              )) : <div className="text-slate-500 text-sm">No active medications</div>}
            </div>
          </div>
        </div>
      </div>

      {/* Clinical Checks Panel (Sticky Right) */}
      <div className="w-80 bg-slate-50 border-l border-slate-200 p-6 flex flex-col h-full">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6">Clinical Checks</h2>
        
        <div className="mb-6">
          <label className="text-xs font-semibold text-slate-600 mb-2 block">Before you order (Duplicate Check)</label>
          <input type="text" placeholder="e.g. HbA1c" className="w-full text-sm p-2 rounded-lg border border-slate-300 outline-none focus:border-blue-600" />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600 mb-2 block">Before you prescribe (Interaction Check)</label>
          <input type="text" placeholder="e.g. Aspirin" className="w-full text-sm p-2 rounded-lg border border-slate-300 outline-none focus:border-blue-600" />
        </div>
      </div>
    </div>
  );
}
