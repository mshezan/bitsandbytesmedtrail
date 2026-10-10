"use client";

import { useState } from "react";
import { Lock, X, FileText, ChevronDown, Check, Wand2 } from "lucide-react";
import { fetchAPI } from "@/lib/api";

const TEMPLATES: Record<string, string> = {
  "OPD Consult SOAP": "S (Subjective):\n- \n\nO (Objective):\n- \n\nA (Assessment):\n- \n\nP (Plan):\n- \n",
  "Follow-up": "Interval History:\n- \n\nCurrent Meds Review:\n- \n\nPlan:\n- \n",
  "Referral Reply": "Thank you for referring this patient.\n\nFindings:\n- \n\nRecommendations:\n- \n",
};

export default function NoteEditor({ patientId, onClose, activeVitals, activeMeds }: any) {
  const [template, setTemplate] = useState("OPD Consult SOAP");
  const [content, setContent] = useState(TEMPLATES["OPD Consult SOAP"]);
  const [signed, setSigned] = useState(false);

  const handleTemplateChange = (e: any) => {
    const val = e.target.value;
    setTemplate(val);
    setContent(TEMPLATES[val] || "");
  };

  const insertVitals = () => {
    const vitalsText = activeVitals.map((v:any) => `${v.name}: ${v.value}`).join(", ");
    setContent(content + `\n[Inserted Vitals]: ${vitalsText}`);
  };

  const insertMeds = () => {
    const medsText = activeMeds.map((m:any) => m.name).join(", ");
    setContent(content + `\n[Inserted Meds]: ${medsText}`);
  };

  const handleSign = async () => {
    try {
      await fetchAPI(`/hospital/patient/${patientId}/note`, {
        method: "POST",
        body: JSON.stringify({ title: `Clinical Note (${template})`, content, template })
      });
      setSigned(true);
    } catch (e) {
      alert("Failed to sign note");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden transition-all duration-300 ${signed ? 'h-96' : 'h-[80vh]'}`}>
        
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-800 text-white">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold">Clinical Note Editor</h2>
          </div>
          <button onClick={onClose} className="hover:bg-slate-700 p-2 rounded-full transition"><X className="w-5 h-5"/></button>
        </div>

        {signed ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 bg-slate-50 text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border-4 border-white">
              <Check className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Note Signed & Locked</h2>
            <p className="text-slate-500 mb-8 max-w-sm mx-auto">This note is now legally locked and appended to the unified timeline.</p>
            <button onClick={onClose} className="px-6 py-3 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-900 transition shadow-sm">
              Close Editor
            </button>
          </div>
        ) : (
          <>
            <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-sm shrink-0">
              <div className="flex gap-4 items-center">
                <select value={template} onChange={handleTemplateChange} className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 outline-none font-medium">
                  {Object.keys(TEMPLATES).map(k => <option key={k} value={k}>{k}</option>)}
                </select>
                <div className="h-4 w-px bg-slate-300"></div>
                <button onClick={insertVitals} className="flex items-center gap-1 text-blue-600 font-semibold hover:bg-blue-50 px-2 py-1 rounded transition"><Wand2 className="w-4 h-4"/> Insert Vitals</button>
                <button onClick={insertMeds} className="flex items-center gap-1 text-blue-600 font-semibold hover:bg-blue-50 px-2 py-1 rounded transition"><Wand2 className="w-4 h-4"/> Insert Active Meds</button>
              </div>
              <span className="text-xs text-emerald-600 font-bold">Autosaved 12s ago</span>
            </div>

            <div className="flex-1 p-6 bg-white overflow-hidden flex flex-col">
              <textarea 
                value={content}
                onChange={e => setContent(e.target.value)}
                className="w-full flex-1 border-0 resize-none outline-none font-serif text-slate-800 leading-relaxed text-lg"
                placeholder="Start typing..."
              ></textarea>
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end items-center shrink-0">
              <div className="flex gap-3">
                <button onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold text-slate-700 hover:bg-slate-200 transition">Save Draft</button>
                <button onClick={handleSign} className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition shadow-lg shadow-slate-300">
                  <Lock className="w-4 h-4" /> Sign & Lock Note
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
