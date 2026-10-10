"use client";

import { useState } from "react";
import { Plus, Trash2, AlertTriangle, Printer, Lock, X, Check, Search } from "lucide-react";
import { fetchAPI } from "@/lib/api";

const COMMON_TESTS = [
  { name: "HbA1c", category: "Lab" },
  { name: "Complete Blood Count (CBC)", category: "Lab" },
  { name: "Lipid Profile", category: "Lab" },
  { name: "Serum Creatinine", category: "Lab" },
  { name: "Chest X-Ray (PA View)", category: "Imaging" },
  { name: "USG Whole Abdomen", category: "Imaging" }
];

export default function OrderComposer({ patientId, onClose, activeLabs }: any) {
  const [rows, setRows] = useState<any[]>([{ id: 1, test: "", priority: "Routine", reason: "", fasting: false, override: "" }]);
  const [signed, setSigned] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [showSearch, setShowSearch] = useState<number | null>(null);

  const addRow = () => setRows([...rows, { id: Date.now(), test: "", priority: "Routine", reason: "", fasting: false, override: "" }]);
  const removeRow = (id: number) => setRows(rows.filter(r => r.id !== id));
  const updateRow = (id: number, field: string, val: any) => setRows(rows.map(r => r.id === id ? { ...r, [field]: val } : r));

  const checkDuplicate = (testName: string) => {
    if (!testName) return null;
    const match = activeLabs?.find((l:any) => l.name.toLowerCase() === testName.toLowerCase());
    if (match) {
      return `Duplicate: Test done recently (${match.date}). Result: ${match.value}`;
    }
    return null;
  };

  const handleSign = async () => {
    // Enforce override reason for duplicates
    for (const r of rows) {
      if (checkDuplicate(r.test) && !r.override) {
        alert(`You must provide an override reason to order a duplicate test: ${r.test}`);
        return;
      }
    }

    try {
      const res = await fetchAPI(`/hospital/patient/${patientId}/order`, {
        method: "POST",
        body: JSON.stringify({ items: rows.filter(r => r.test).map(r => ({ test_name: r.test, priority: r.priority, reason: r.reason, fasting: r.fasting, override_reason: r.override })) })
      });
      setSigned(true);
      setOrderId(res.order_id);
    } catch (e) {
      alert("Failed to place order");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col overflow-hidden transition-all duration-300 ${signed ? 'h-[600px]' : 'h-[85vh]'}`}>
        
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-blue-600 text-white">
          <div>
            <h2 className="text-lg font-bold">Order Composer</h2>
            <p className="text-blue-100 text-sm">Labs & Imaging with Live Duplicate Checks</p>
          </div>
          <button onClick={onClose} className="hover:bg-blue-700 p-2 rounded-full transition"><X className="w-5 h-5"/></button>
        </div>

        {signed ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 bg-slate-50 text-center relative print:bg-white print:p-0">
            <div className="print:hidden">
              <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border-4 border-white">
                <Check className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Order Placed</h2>
              <p className="text-slate-500 mb-8 max-w-md mx-auto">Requisition {orderId} has been securely transmitted and logged in the patient's unified record.</p>
              
              <div className="flex gap-4 justify-center">
                <button onClick={() => window.print()} className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-300 rounded-xl font-medium text-slate-700 hover:bg-slate-50 transition shadow-sm">
                  <Printer className="w-4 h-4" /> Print Requisition
                </button>
                <button onClick={onClose} className="px-6 py-3 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-900 transition shadow-sm">
                  Close Workspace
                </button>
              </div>
            </div>

            {/* Print Layout */}
            <div className="hidden print:block w-full text-left font-serif p-8">
              <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-end">
                <div>
                  <h1 className="text-3xl font-bold">Kaveri Hospital - Lab Requisition</h1>
                  <p className="text-sm">Dr. Ramesh Iyer (Reg: KMC-99212)</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">Ref: {orderId}</p>
                  <p className="text-sm">Date: {new Date().toLocaleDateString()}</p>
                </div>
              </div>
              <div className="mb-8">
                <ul className="space-y-4">
                  {rows.filter(r => r.test).map((r, i) => (
                    <li key={i} className="flex gap-4 items-start border-b border-slate-100 pb-2">
                      <span className="font-bold text-lg w-8">{i+1}.</span>
                      <div>
                        <div className="font-bold text-lg">{r.test} <span className="text-sm font-normal bg-slate-200 px-2 py-0.5 rounded">{r.priority}</span></div>
                        <div className="text-sm italic">Clinical Reason: {r.reason || 'N/A'}</div>
                        {r.fasting && <div className="text-sm font-bold mt-1">FASTING REQUIRED</div>}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
              <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
                <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-slate-100 border-b border-slate-200 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                  <div className="col-span-4">Test / Investigation</div>
                  <div className="col-span-2">Priority</div>
                  <div className="col-span-3">Clinical Reason</div>
                  <div className="col-span-2 text-center">Options</div>
                  <div className="col-span-1 text-center"></div>
                </div>

                <div className="divide-y divide-slate-100">
                  {rows.map((row) => {
                    const dupWarning = checkDuplicate(row.test);
                    return (
                      <div key={row.id} className="p-4 items-start relative group hover:bg-slate-50 transition">
                        <div className="grid grid-cols-12 gap-4 items-start">
                          <div className="col-span-4 relative">
                            <input 
                              type="text" 
                              value={row.test}
                              onChange={(e) => updateRow(row.id, 'test', e.target.value)}
                              onFocus={() => setShowSearch(row.id)}
                              onBlur={() => setTimeout(() => setShowSearch(null), 200)}
                              placeholder="Search test..." 
                              className="w-full border border-slate-300 rounded p-2 text-sm focus:border-blue-500 outline-none"
                            />
                            {showSearch === row.id && (
                              <div className="absolute z-10 top-full left-0 w-full mt-1 bg-white border border-slate-200 shadow-xl rounded-lg max-h-48 overflow-y-auto">
                                {COMMON_TESTS.filter(t => t.name.toLowerCase().includes(row.test.toLowerCase())).map((t, i) => (
                                  <div 
                                    key={i} 
                                    className="p-2 hover:bg-blue-50 cursor-pointer text-sm font-bold text-slate-800"
                                    onMouseDown={() => updateRow(row.id, 'test', t.name)}
                                  >
                                    {t.name} <span className="text-xs font-normal text-slate-500 float-right">{t.category}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="col-span-2">
                            <select value={row.priority} onChange={e => updateRow(row.id, 'priority', e.target.value)} className="w-full border border-slate-300 rounded p-2 text-sm bg-white focus:border-blue-500 outline-none">
                              <option>Routine</option><option>Urgent</option><option>STAT</option>
                            </select>
                          </div>

                          <div className="col-span-3">
                            <input type="text" value={row.reason} onChange={e => updateRow(row.id, 'reason', e.target.value)} placeholder="Reason..." className="w-full border border-slate-300 rounded p-2 text-sm focus:border-blue-500 outline-none" />
                          </div>

                          <div className="col-span-2 flex items-center justify-center gap-2">
                            <label className="text-sm flex items-center gap-1 cursor-pointer">
                              <input type="checkbox" checked={row.fasting} onChange={e => updateRow(row.id, 'fasting', e.target.checked)} />
                              Fasting
                            </label>
                          </div>

                          <div className="col-span-1 flex items-center justify-center">
                            <button onClick={() => removeRow(row.id)} className="text-slate-400 hover:text-red-600 transition p-2 rounded-full hover:bg-red-50">
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        {/* Duplicate Warning Panel Inline */}
                        {dupWarning && (
                          <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-3 items-start">
                            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                            <div className="flex-1">
                              <div className="text-sm font-bold text-amber-900">{dupWarning}</div>
                              <input 
                                type="text" 
                                placeholder="Mandatory: Reason for ordering duplicate..." 
                                value={row.override}
                                onChange={e => updateRow(row.id, 'override', e.target.value)}
                                className="mt-2 w-full border border-amber-300 rounded px-3 py-1.5 text-sm outline-none focus:border-amber-500 bg-white"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                <div className="p-4 bg-slate-50 border-t border-slate-200">
                  <button onClick={addRow} className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 bg-white border border-blue-200 px-4 py-2 rounded-lg hover:bg-blue-50 transition shadow-sm">
                    <Plus className="w-4 h-4" /> Add Order Item
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-white flex justify-between items-center shrink-0">
              <div className="flex gap-3 ml-auto">
                <button onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold text-slate-700 hover:bg-slate-100 transition">Cancel</button>
                <button onClick={handleSign} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-[0_0_15px_rgba(37,99,235,0.3)]">
                  <Lock className="w-4 h-4" /> Sign & Place Order
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
