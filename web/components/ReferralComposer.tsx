"use client";
import { useState } from "react";
import { Send, FileText, X, Check, Search, Paperclip } from "lucide-react";
import { fetchAPI } from "@/lib/api";

const ORGS = [
  "Metro Diagnostics", "Sanjeevani Clinic", "Apollo Hospitals", "Narayana Hrudayalaya"
];

const SPECIALTIES = [
  "Cardiology", "Neurology", "Oncology", "Endocrinology", "Orthopedics", "General Surgery"
];

export default function ReferralComposer({ patientId, onClose }: any) {
  const [org, setOrg] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [reason, setReason] = useState("");
  const [urgency, setUrgency] = useState("Routine");
  const [sent, setSent] = useState(false);
  const [refId, setRefId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const handoverSections = ["Pre-Visit Brief Summary", "Active Medications", "Active Allergies", "Latest Vitals", "Key Labs (Last 30 days)", "Relevant Discharge Summaries"];
  const [sections, setSections] = useState(handoverSections);

  const handleSend = async () => {
    setBusy(true); setError("");
    try {
      const result = await fetchAPI(`/hospital/patient/${patientId}/referral`, {
        method: "POST",
        body: JSON.stringify({ organization: org, specialty, reason, urgency, sections }),
      });
      setRefId(result.referral_id);
      setSent(true);
    } catch (e: any) {
      setError(e.message || "Referral could not be sent. Confirm patient access and try again.");
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden transition-all duration-300 ${sent ? 'h-96' : 'h-[85vh]'}`}>
        
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-indigo-600 text-white">
          <div className="flex items-center gap-3">
            <Send className="w-5 h-5 text-indigo-200" />
            <h2 className="text-lg font-bold">Referral Composer</h2>
          </div>
          <button onClick={onClose} className="hover:bg-indigo-700 p-2 rounded-full transition"><X className="w-5 h-5"/></button>
        </div>

        {sent ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 bg-slate-50 text-center">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border-4 border-white">
              <Check className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Referral Recorded</h2>
            <p className="text-slate-500 mb-2 max-w-sm mx-auto">Reference: {refId}</p>
            <p className="text-slate-500 mb-8 max-w-sm mx-auto">The referral is saved to the patient&apos;s MedTrail history for {org}. External delivery requires a connected provider network.</p>
            <button onClick={onClose} className="px-6 py-3 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-900 transition shadow-sm">
              Close Editor
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto flex">
              <div className="flex-1 p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Target Organization</label>
                    <select value={org} onChange={e=>setOrg(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500">
                      <option value="">-- Select --</option>
                      {ORGS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Specialty / Department</label>
                    <select value={specialty} onChange={e=>setSpecialty(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500">
                      <option value="">-- Select --</option>
                      {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Urgency</label>
                  <div className="flex gap-4">
                    {["Routine", "Urgent", "Two-Week Wait"].map(u => (
                      <label key={u} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="radio" name="urgency" checked={urgency === u} onChange={() => setUrgency(u)} />
                        {u}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Clinical Reason for Referral</label>
                  <textarea value={reason} onChange={e=>setReason(e.target.value)} rows={4} className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:border-indigo-500 resize-none" placeholder="Please evaluate this patient for..."></textarea>
                </div>
              </div>

              <div className="w-72 bg-slate-50 border-l border-slate-200 p-6 flex flex-col">
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"><Paperclip className="w-4 h-4"/> Handover Packet</h3>
                <p className="text-xs text-slate-500 mb-4">Choose the history sections to include in this referral record.</p>
                
                <div className="space-y-3">
                  {handoverSections.map((lbl, i) => (
                    <label key={i} className="flex items-start gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={sections.includes(lbl)} onChange={event => setSections(current => event.target.checked ? [...current, lbl] : current.filter(section => section !== lbl))} className="mt-0.5" />
                      <span className="text-slate-700 leading-tight">{lbl}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-white flex justify-between items-center shrink-0">
              {error ? <p role="alert" className="mr-4 text-sm text-rose-700">{error}</p> : <span />}
              <div className="flex gap-3">
                <button onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold text-slate-700 hover:bg-slate-200 transition">Cancel</button>
                <button onClick={handleSend} disabled={!org || !specialty || !reason.trim() || busy} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-700 text-white rounded-xl font-bold hover:bg-emerald-800 transition disabled:opacity-50 disabled:cursor-not-allowed">
                  <Send className="w-4 h-4" /> {busy ? "Saving…" : "Create Referral"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
