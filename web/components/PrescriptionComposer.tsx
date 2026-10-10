"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, AlertTriangle, Info, Printer, Lock, X, Check, Search, GripVertical } from "lucide-react";
import { fetchAPI } from "@/lib/api";

const COMMON_DRUGS = [
  { name: "Glycomet (Metformin)", generic: "Metformin", form: "Tab", strengths: ["500mg", "850mg", "1000mg"] },
  { name: "Ecosprin", generic: "Aspirin", form: "Tab", strengths: ["75mg", "150mg"] },
  { name: "Telma", generic: "Telmisartan", form: "Tab", strengths: ["20mg", "40mg", "80mg"] },
  { name: "Augmentin", generic: "Amoxicillin + Clavulanic Acid", form: "Tab", strengths: ["375mg", "625mg"] },
  { name: "Dolo", generic: "Paracetamol", form: "Tab", strengths: ["500mg", "650mg"] },
];

export default function PrescriptionComposer({ patientId, onClose, activeConditions, activeAllergies, activeMeds }: any) {
  const [rows, setRows] = useState<any[]>([{ id: 1, drug: "", dose: "", route: "Oral", freq: "1-0-1", timing: "After Food", duration: "5 days", instructions: "", problem: "" }]);
  const [searchQ, setSearchQ] = useState("");
  const [showSearch, setShowSearch] = useState<number | null>(null);
  const [warnings, setWarnings] = useState<any[]>([]);
  const [signed, setSigned] = useState(false);
  const [rxId, setRxId] = useState("");

  const addRow = () => setRows([...rows, { id: Date.now(), drug: "", dose: "", route: "Oral", freq: "1-0-1", timing: "After Food", duration: "5 days", instructions: "", problem: "" }]);
  
  const removeRow = (id: number) => setRows(rows.filter(r => r.id !== id));
  
  const updateRow = (id: number, field: string, val: string) => {
    setRows(rows.map(r => r.id === id ? { ...r, [field]: val } : r));
  };

  const loadTemplate = (name: string) => {
    if (name === 'Diabetes') {
      setRows([
        { id: Date.now(), drug: "Glycomet (Metformin)", dose: "500mg", route: "Oral", freq: "1-0-1", timing: "After Food", duration: "30 days", instructions: "Strict adherence", problem: "T2DM" },
        { id: Date.now()+1, drug: "Telma", dose: "40mg", route: "Oral", freq: "1-0-0", timing: "Before Food", duration: "30 days", instructions: "", problem: "HTN" }
      ]);
    }
  };

  useEffect(() => {
    // Live safety checks
    const newWarnings: any[] = [];
    rows.forEach(r => {
      if (!r.drug) return;
      const drugLower = r.drug.toLowerCase();
      
      // Allergy check
      if (activeAllergies.some((a:any) => drugLower.includes('augmentin') && a.name.toLowerCase().includes('penicillin'))) {
        newWarnings.push({ id: r.id, severity: 'hard', text: `ALLERGY ALERT: Patient is allergic to Penicillin. Augmentin is contraindicated.` });
      }
      // Duplicate check (intra)
      if (rows.filter(x => x.drug && x.drug === r.drug).length > 1) {
        if (!newWarnings.some(w => w.text.includes('Duplicate row'))) {
          newWarnings.push({ id: r.id, severity: 'medium', text: `Duplicate row for ${r.drug} in this prescription.` });
        }
      }
      // Duplicate check (active meds)
      if (activeMeds.some((m:any) => m.name.toLowerCase().includes('metformin') || m.name.toLowerCase().includes('glycomet'))) {
        if (drugLower.includes('glycomet') || drugLower.includes('metformin')) {
          newWarnings.push({ id: r.id, severity: 'medium', text: `Duplicate Therapy: Patient is already on Metformin (from another source).` });
        }
      }
      // Interaction check
      if (drugLower.includes('ecosprin') || drugLower.includes('aspirin')) {
        if (activeMeds.some((m:any) => m.name.toLowerCase().includes('ibuprofen'))) {
          newWarnings.push({ id: r.id, severity: 'high', text: `Interaction: Aspirin + Ibuprofen (GI Bleeding Risk)` });
        }
      }
    });
    setWarnings(newWarnings);
  }, [rows, activeAllergies, activeMeds]);

  const handleSign = async () => {
    if (warnings.some(w => w.severity === 'hard')) {
      alert("Please resolve HARD STOP allergy conflicts before signing.");
      return;
    }
    
    try {
      const res = await fetchAPI(`/hospital/patient/${patientId}/prescription`, {
        method: "POST",
        body: JSON.stringify({ items: rows.filter(r => r.drug) })
      });
      setSigned(true);
      setRxId(res.rx_id);
    } catch (e) {
      alert("Failed to sign prescription");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col overflow-hidden transition-all duration-300 ${signed ? 'h-[600px]' : 'h-[85vh]'}`}>
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-emerald-600 text-white">
          <div>
            <h2 className="text-lg font-bold">Prescription Composer</h2>
            <p className="text-emerald-100 text-sm">Live safety checks active</p>
          </div>
          <button onClick={onClose} className="hover:bg-emerald-700 p-2 rounded-full transition"><X className="w-5 h-5"/></button>
        </div>

        {signed ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 bg-slate-50 text-center relative print:bg-white print:p-0">
            <div className="print:hidden">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border-4 border-white">
                <Check className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Prescription Signed & Locked</h2>
              <p className="text-slate-500 mb-8 max-w-md mx-auto">This prescription has been securely appended to the patient's unified timeline and is visible in their patient portal.</p>
              
              <div className="flex gap-4 justify-center">
                <button onClick={handlePrint} className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-300 rounded-xl font-medium text-slate-700 hover:bg-slate-50 transition shadow-sm">
                  <Printer className="w-4 h-4" /> Print / PDF
                </button>
                <button onClick={onClose} className="px-6 py-3 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-900 transition shadow-sm">
                  Close Workspace
                </button>
              </div>
            </div>

            {/* Print Area (Visually hidden unless printing, but mocked for UI) */}
            <div className="hidden print:block w-full text-left font-serif p-8">
              <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-end">
                <div>
                  <h1 className="text-3xl font-bold">Kaveri Hospital</h1>
                  <p className="text-sm">Dr. Ramesh Iyer (Reg: KMC-99212)</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">Ref: {rxId}</p>
                  <p className="text-sm">Date: {new Date().toLocaleDateString()}</p>
                </div>
              </div>
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-4 border-b border-slate-200 pb-2">Rx</h3>
                <ul className="space-y-4">
                  {rows.filter(r => r.drug).map((r, i) => (
                    <li key={i} className="flex gap-4 items-start">
                      <span className="font-bold text-lg w-8">{i+1}.</span>
                      <div>
                        <div className="font-bold text-lg">{r.drug} {r.dose}</div>
                        <div className="text-sm italic">{r.freq} - {r.timing} - {r.duration}</div>
                        {r.instructions && <div className="text-sm mt-1">Note: {r.instructions}</div>}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-20 pt-4 border-t-2 border-black border-dashed text-center text-sm">
                Valid at any ABDM network pharmacy via QR / {rxId}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Toolbar */}
            <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-sm">
              <div className="flex gap-2 items-center">
                <span className="font-bold text-slate-600">Templates:</span>
                <button onClick={() => loadTemplate('Diabetes')} className="px-3 py-1 bg-white border border-slate-300 rounded hover:bg-slate-100 text-slate-700">T2DM Follow-up</button>
                <button className="px-3 py-1 bg-white border border-slate-300 rounded hover:bg-slate-100 text-slate-700">Hypertension</button>
                <button className="px-3 py-1 bg-white border border-slate-300 rounded hover:bg-slate-100 text-slate-700 font-medium text-emerald-700 border-emerald-200 bg-emerald-50">+ Repeat Last Rx</button>
              </div>
            </div>

            {/* Composer Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
              
              {/* Warnings Panel */}
              {warnings.length > 0 && (
                <div className="mb-6 space-y-2">
                  {warnings.map((w, i) => (
                    <div key={i} className={`p-3 rounded-xl border flex items-start gap-3 shadow-sm ${w.severity === 'hard' ? 'bg-red-50 border-red-200 text-red-900' : w.severity === 'high' ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-blue-50 border-blue-200 text-blue-900'}`}>
                      <AlertTriangle className={`w-5 h-5 shrink-0 ${w.severity === 'hard' ? 'text-red-600' : w.severity === 'high' ? 'text-amber-600' : 'text-blue-600'}`} />
                      <div className="text-sm font-medium">{w.text}</div>
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
                <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-slate-100 border-b border-slate-200 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                  <div className="col-span-3">Drug / Brand</div>
                  <div className="col-span-2">Dose & Route</div>
                  <div className="col-span-2">Freq & Timing</div>
                  <div className="col-span-2">Duration</div>
                  <div className="col-span-2">Problem Link</div>
                  <div className="col-span-1 text-center"></div>
                </div>

                <div className="divide-y divide-slate-100">
                  {rows.map((row, idx) => (
                    <div key={row.id} className="grid grid-cols-12 gap-4 p-4 items-start relative group hover:bg-slate-50 transition">
                      <div className="col-span-3 relative">
                        <input 
                          type="text" 
                          value={row.drug}
                          onChange={(e) => {
                            updateRow(row.id, 'drug', e.target.value);
                            setSearchQ(e.target.value);
                            setShowSearch(row.id);
                          }}
                          onFocus={() => setShowSearch(row.id)}
                          onBlur={() => setTimeout(() => setShowSearch(null), 200)}
                          placeholder="Search generic/brand..." 
                          className="w-full border border-slate-300 rounded p-2 text-sm focus:border-emerald-500 outline-none"
                        />
                        {showSearch === row.id && searchQ.length > 1 && (
                          <div className="absolute z-10 top-full left-0 w-full mt-1 bg-white border border-slate-200 shadow-xl rounded-lg max-h-48 overflow-y-auto">
                            {COMMON_DRUGS.filter(d => d.name.toLowerCase().includes(searchQ.toLowerCase()) || d.generic.toLowerCase().includes(searchQ.toLowerCase())).map((d, i) => (
                              <div 
                                key={i} 
                                className="p-2 hover:bg-emerald-50 cursor-pointer border-b border-slate-50 last:border-0"
                                onMouseDown={() => {
                                  updateRow(row.id, 'drug', d.name);
                                  if (!row.dose) updateRow(row.id, 'dose', d.strengths[0]);
                                }}
                              >
                                <div className="font-bold text-sm text-slate-800">{d.name}</div>
                                <div className="text-xs text-slate-500">{d.generic} • {d.form}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="col-span-2 flex gap-2">
                        <input type="text" value={row.dose} onChange={e => updateRow(row.id, 'dose', e.target.value)} placeholder="e.g. 500mg" className="w-1/2 border border-slate-300 rounded p-2 text-sm focus:border-emerald-500 outline-none" />
                        <select value={row.route} onChange={e => updateRow(row.id, 'route', e.target.value)} className="w-1/2 border border-slate-300 rounded p-2 text-sm bg-white focus:border-emerald-500 outline-none">
                          <option>Oral</option><option>IV</option><option>IM</option><option>Topical</option>
                        </select>
                      </div>

                      <div className="col-span-2 flex flex-col gap-2">
                        <select value={row.freq} onChange={e => updateRow(row.id, 'freq', e.target.value)} className="w-full border border-slate-300 rounded p-2 text-sm bg-white focus:border-emerald-500 outline-none">
                          <option>1-0-0</option><option>1-0-1</option><option>1-1-1</option><option>0-0-1</option><option>SOS</option><option>Once</option>
                        </select>
                        <select value={row.timing} onChange={e => updateRow(row.id, 'timing', e.target.value)} className="w-full border border-slate-300 rounded p-2 text-sm bg-white focus:border-emerald-500 outline-none">
                          <option>After Food</option><option>Before Food</option><option>Empty Stomach</option><option>Anytime</option>
                        </select>
                      </div>

                      <div className="col-span-2">
                        <input type="text" value={row.duration} onChange={e => updateRow(row.id, 'duration', e.target.value)} placeholder="e.g. 5 days" className="w-full border border-slate-300 rounded p-2 text-sm focus:border-emerald-500 outline-none" />
                      </div>

                      <div className="col-span-2">
                        <select value={row.problem} onChange={e => updateRow(row.id, 'problem', e.target.value)} className="w-full border border-slate-300 rounded p-2 text-sm bg-white focus:border-emerald-500 outline-none">
                          <option value="">-- Link --</option>
                          {activeConditions?.map((c:any, i:number) => (
                            <option key={i} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                        <input type="text" value={row.instructions} onChange={e => updateRow(row.id, 'instructions', e.target.value)} placeholder="Special instructions..." className="w-full mt-2 border border-slate-300 rounded p-2 text-xs focus:border-emerald-500 outline-none" />
                      </div>

                      <div className="col-span-1 flex items-center justify-center h-full">
                        <button onClick={() => removeRow(row.id)} className="text-slate-400 hover:text-red-600 transition p-2 rounded-full hover:bg-red-50">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="p-4 bg-slate-50 border-t border-slate-200">
                  <button onClick={addRow} className="flex items-center gap-2 text-sm font-bold text-emerald-600 hover:text-emerald-700 bg-white border border-emerald-200 px-4 py-2 rounded-lg hover:bg-emerald-50 transition shadow-sm">
                    <Plus className="w-4 h-4" /> Add Drug Row
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-200 bg-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Info className="w-4 h-4" /> Unsaved draft (local)
              </div>
              <div className="flex gap-3">
                <button onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold text-slate-700 hover:bg-slate-100 transition">Cancel</button>
                <button onClick={handleSign} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                  <Lock className="w-4 h-4" /> Sign & Lock Rx
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
