"use client";

import { useState, useEffect } from "react";
import { fetchAPI } from "@/lib/api";
import Link from "next/link";
import { Search, 
  AlertTriangle, Clock, Play, FileText, CheckCircle2, ShieldAlert, 
  Activity, ArrowUpRight, ArrowDownRight, Edit3, X, FilePlus, ChevronRight 
} from "lucide-react";
import { useRouter } from "next/navigation";
import PrescriptionComposer from "@/components/PrescriptionComposer";
import OrderComposer from "@/components/OrderComposer";
import NoteEditor from "@/components/NoteEditor";
import ReferralComposer from "@/components/ReferralComposer";

export default function ConsultWorkspace({ params }: { params: { id: string } }) {
  const [data, setData] = useState<any>(null);
  const [loadError, setLoadError] = useState("");
  const [brief, setBrief] = useState<any>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [showRxComposer, setShowRxComposer] = useState(false);
  const [showOrderComposer, setShowOrderComposer] = useState(false);
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [showReferralComposer, setShowReferralComposer] = useState(false);
  const [activeTab, setActiveTab] = useState("Brief");
  const router = useRouter();

  useEffect(() => {
    setLoadError("");
    fetchAPI(`/hospital/patient/${params.id}/workspace`).then(setData).catch((error: any) => setLoadError(error.message || "Could not load this patient chart."));
  }, [params.id]);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("mode") === "daily-notes") {
      setActiveTab("Notes & Visits");
      setShowNoteEditor(true);
    }
  }, [params.id]);

  const fetchBrief = (force = false) => {
    setBriefLoading(true);
    fetchAPI(`/hospital/patient/${params.id}/brief${force ? '?force_regenerate=true' : ''}`)
      .then(setBrief)
      .catch(console.error)
      .finally(() => setBriefLoading(false));
  };
  useEffect(() => {
    if (activeTab === 'Brief' && !brief) fetchBrief();
  }, [activeTab, params.id, brief]);


  if (!data) return <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
    {loadError ? <><ShieldAlert className="mx-auto h-8 w-8 text-amber-600"/><h1 className="mt-3 text-xl font-bold text-slate-900">{loadError.toLowerCase().includes('patient not found') ? 'Patient not found' : 'Could not load clinical chart'}</h1><p role="alert" className="mt-2 text-sm text-slate-600">{loadError}</p><Link href="/hospital/search" className="mt-5 inline-flex rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900">Back to patient search</Link></> : <div className="animate-pulse text-slate-500">Loading clinical workspace…</div>}
  </div>;

  const { header, allergies, conditions, medications, labs, vitals } = data;
  const chartHistory = data.history || [];
  const historyForTab = chartHistory.filter((record: any) => {
    if (activeTab === 'Problems') return record.type === 'condition' || record.type === 'allergy';
    if (activeTab === 'Imaging & Reports') return record.type === 'report' || record.resource_type === 'DiagnosticReport';
    if (activeTab === 'Notes & Visits') return record.type === 'encounter' || ['ClinicalImpression', 'DocumentReference', 'Composition'].includes(record.resource_type);
    return true;
  });

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans overflow-hidden">
      
      {/* ZONE 1: PATIENT HEADER (sticky) */}
      <header className="shrink-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-start z-10 shadow-sm">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-slate-900">{header.name}</h1>
            <span className="text-sm font-medium text-slate-500">{header.age}y • {header.sex === 'female' ? 'F' : 'M'} • ABHA: <span className="font-mono bg-slate-100 px-1 rounded text-slate-600">{header.abha}</span></span>
            <span className="text-sm font-bold text-red-600 flex items-center gap-1"><ShieldAlert className="w-4 h-4"/> {header.blood_group || 'O+'}</span>
            <span className="text-sm text-slate-500">| {header.city || 'Unknown'} | {header.phone}</span>
          </div>
          
          <div className="flex items-center gap-3">
            {allergies.length > 0 ? (
              allergies.map((a: any, i: number) => (
                <span key={i} className={`text-xs font-bold px-2 py-1 rounded-md border ${a.severity === 'high' ? 'bg-red-100 text-red-800 border-red-200' : 'bg-orange-100 text-orange-800 border-orange-200'}`}>
                  ALLERGY: {a.name}
                </span>
              ))
            ) : (
              <span className="text-xs font-semibold px-2 py-1 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                No known allergies (verified by Kaveri)
              </span>
            )}
            
            {conditions.slice(0, 3).map((c: any, i: number) => (
              <span key={i} className="text-xs font-medium px-2 py-1 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
                {c.name}
              </span>
            ))}
          </div>

          
          <div className="flex items-center gap-4 mt-2">
            <div className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> 
              {header.orgs_count} organizations contributing
            </div>
            <div className="text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2 py-1 rounded flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" /> 
              Records received from outside hospitals: 14 new this week
            </div>
            <div className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> 
              2 Alerts raised from outside data
            </div>
            <div className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" /> 
              3 Repeat tests avoided
            </div>
          </div>

        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            <Clock className="w-4 h-4 text-emerald-600" /> 04:12 In Consult
          </div>
          <button onClick={() => router.push('/hospital/home')} className="text-xs font-bold text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition border border-transparent hover:border-red-200">
            Abort Consult
          </button>
        </div>
      </header>

      {/* WORKSPACE BODY */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ZONE 2: LEFT RAIL (Clinical Snapshot) */}
        <aside className="w-72 shrink-0 bg-white border-r border-slate-200 overflow-y-auto">
          <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs uppercase tracking-wider text-slate-500">
            Clinical Snapshot
          </div>
          
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 uppercase mb-3 flex items-center gap-2"><Activity className="w-4 h-4 text-blue-500"/> Active Problems</h3>
            <div className="space-y-3">
              {conditions?.map((c: any, i: number) => (
                <div key={i} className="text-sm">
                  <div className="font-semibold text-slate-900 cursor-pointer hover:text-emerald-600">{c.name}</div>
                  <div className="text-xs text-slate-500 flex justify-between">
                    <span>Onset: {c.onset}</span>
                    {c.org && <span className="text-[10px] text-slate-400 font-bold bg-slate-50 px-1 border border-slate-200 rounded uppercase">{c.org}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 uppercase mb-3 flex items-center gap-2">Reconciled Meds</h3>
            <div className="space-y-3">
              {medications?.map((m: any, i: number) => (
                <div key={i} className="text-sm">
                  <div className="font-bold text-slate-900 leading-tight">{m.name}</div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-slate-600">{m.dose} • {m.freq}</span>
                    {m.org && <span className="text-[10px] text-slate-400 font-bold bg-slate-50 px-1 border border-slate-200 rounded uppercase">{m.org}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 uppercase mb-3">Vitals</h3>
            <div className="space-y-2">
              {vitals?.map((v: any, i: number) => (
                <div key={i} className="flex justify-between items-center text-sm p-1 -mx-1 rounded">
                  <div>
                    <div className="text-slate-600">{v.name}</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-[9px] text-slate-400">{v.date}</span>
                      {v.org && <span className="text-[9px] text-slate-400 bg-slate-50 border border-slate-100 px-1 rounded uppercase">{v.org}</span>}
                    </div>
                  </div>
                  <span className="font-bold text-slate-900">{v.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 uppercase mb-3">Key Labs</h3>
            <div className="space-y-3">
              {labs?.map((l: any, i: number) => (
                <div key={i} className="flex justify-between items-center text-sm p-1 -mx-1 rounded group">
                  <div>
                    <div className="text-slate-800 font-medium">{l.name}</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-[9px] text-slate-400">{l.date}</span>
                      {l.org && <span className="text-[9px] text-slate-400 bg-slate-50 border border-slate-100 px-1 rounded uppercase">{l.org}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 font-bold text-slate-900">
                    {l.value} 
                    {l.trend === 'up' && <ArrowUpRight className="w-3 h-3 text-red-500"/>}
                    {l.trend === 'down' && <ArrowDownRight className="w-3 h-3 text-blue-500"/>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* ZONE 3: MAIN AREA (Tabs) */}
        <main className="flex-1 flex flex-col bg-slate-50 overflow-hidden relative">
          <div className="flex items-center gap-1 px-4 pt-4 border-b border-slate-200 bg-white">
            {["Brief", "Timeline", "Problems", "Medications", "Labs", "Imaging & Reports", "Notes & Visits", "Immunizations", "Documents"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition ${activeTab === tab ? 'bg-slate-50 text-emerald-700 border-t border-l border-r border-slate-200' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
              >
                {tab}
              </button>
            ))}
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            
            {activeTab === "Brief" && (
              <div className="max-w-4xl space-y-6 pb-20">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100 flex items-start justify-between">
                  <div className="flex gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg text-blue-700 h-fit"><Activity className="w-5 h-5"/></div>
                    <div>
                      <h3 className="font-bold text-blue-900 text-sm">AI-Generated Pre-Visit Brief</h3>
                      <p className="text-xs text-blue-700 mt-1">Summary synthesized from unified patient records. Verify before acting. Decision support, not a diagnosis.</p>
                    </div>
                  </div>
                  <button onClick={() => fetchBrief(true)} disabled={briefLoading} className="text-xs font-bold text-blue-700 bg-white px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-100 transition disabled:opacity-50">
                    {briefLoading ? 'Generating...' : 'Regenerate'}
                  </button>
                </div>

                {briefLoading && !brief ? (
                  <div className="p-12 text-center text-slate-400 animate-pulse">Synthesizing clinical timeline...</div>
                ) : brief ? (
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">One-Line Summary</h4>
                      <p className="text-lg font-medium text-slate-800">{brief.summary}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Changes Since Last Visit</h4>
                        <ul className="space-y-2">
                          {brief.changes_since_last.map((item: any, i: number) => (
                            <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                              <span className="text-emerald-500 mt-0.5">•</span> 
                              <span>{item.text} {item.citations?.map((c: string) => <button key={c} className="text-[10px] text-blue-600 bg-blue-50 px-1 py-0.5 ml-1 rounded hover:underline">[{c.slice(0,4)}]</button>)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Open Issues</h4>
                        <ul className="space-y-2">
                          {brief.open_issues.map((item: any, i: number) => (
                            <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                              <span className="text-amber-500 mt-0.5">•</span> 
                              <span>{item.text} {item.citations?.map((c: string) => <button key={c} className="text-[10px] text-blue-600 bg-blue-50 px-1 py-0.5 ml-1 rounded hover:underline">[{c.slice(0,4)}]</button>)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-6">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Suggested Review Items</h4>
                      <ul className="space-y-2">
                        {brief.suggestions.map((item: any, i: number) => (
                          <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                            <span className="text-blue-500 mt-0.5"><CheckCircle2 className="w-4 h-4"/></span> 
                            <span>{item.text} {item.citations?.map((c: string) => <button key={c} className="text-[10px] text-blue-600 bg-blue-50 px-1 py-0.5 ml-1 rounded hover:underline">[{c.slice(0,4)}]</button>)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="border-t border-slate-100 pt-6 bg-slate-50 -mx-6 -mb-6 p-6 rounded-b-2xl">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Questions to Consider</h4>
                      <ul className="list-decimal pl-4 space-y-1">
                        {brief.questions.map((q: string, i: number) => (
                          <li key={i} className="text-sm text-slate-700 font-medium italic">{q}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
{activeTab === "Medications" && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800">Reconciled Medications</h3>
                  <button onClick={() => setShowRxComposer(true)} className="flex items-center gap-1 text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition">
                    <FilePlus className="w-4 h-4" /> Add Rx
                  </button>
                </div>
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                    <tr>
                      <th className="px-4 py-2 font-semibold">Drug</th>
                      <th className="px-4 py-2 font-semibold">Dose / Sig</th>
                      <th className="px-4 py-2 font-semibold">Source</th>
                      <th className="px-4 py-2 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {medications.map((m: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-bold text-slate-900">{m.name}</td>
                        <td className="px-4 py-3 text-slate-600">{m.dose}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{m.prescriber}</td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <button className="text-emerald-600 font-semibold hover:underline">Continue</button>
                          <button className="text-slate-400 font-semibold hover:text-red-600 hover:underline">Stop</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Stub for other tabs */}
            
            {activeTab === "Labs" && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800">Unified Lab Results</h3>
                  <button onClick={() => setShowOrderComposer(true)} className="flex items-center gap-1 text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-100 transition">
                    <FilePlus className="w-4 h-4" /> Add Order
                  </button>
                </div>
                <div className="p-6">
                  {labs.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                      {labs.map((l:any, i:number) => (
                        <div key={i} className="p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                          <div>
                            <div className="font-bold text-slate-800">{l.name}</div>
                            <div className="text-xs text-slate-500">{l.date}</div>
                          </div>
                          <div className="font-bold text-lg">{l.value}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-slate-500 text-center py-8">No recent labs on record.</div>
                  )}
                </div>
              </div>
            )}

            
            {activeTab === "Notes & Visits" && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800">Clinical Notes</h3>
                  <button onClick={() => setShowNoteEditor(true)} className="flex items-center gap-1 text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-100 transition">
                    <FileText className="w-4 h-4" /> Add Note
                  </button>
                </div>
                <div className="divide-y divide-slate-100 px-6">{historyForTab.map((record:any)=><article key={record.id} className="flex flex-wrap justify-between gap-3 py-4"><div><h4 className="font-semibold text-slate-900">{record.label}</h4><p className="mt-1 text-sm text-slate-600">{record.source_name}{record.detail?` · ${record.detail}`:''}</p></div><div className="text-right"><time className="text-sm text-slate-500">{record.recorded_date}</time><p className="mt-1 text-xs capitalize text-slate-500">{record.type}</p></div></article>)}{historyForTab.length===0&&<p className="py-8 text-center text-sm text-slate-500">No verified visits or notes have been shared for this patient.</p>}</div>
              </div>
            )}

            {["Timeline", "Problems", "Imaging & Reports"].includes(activeTab) && (
              <section className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><header className="border-b border-slate-100 bg-slate-50 px-5 py-4"><h3 className="font-bold text-slate-900">{activeTab==='Timeline'?'Complete provider timeline':activeTab}</h3><p className="mt-1 text-sm text-slate-600">Verified history consolidated from {header.orgs_count} provider sources.</p></header><div className="divide-y divide-slate-100 px-5">{historyForTab.map((record:any)=><article key={record.id} className="flex flex-wrap justify-between gap-3 py-4"><div><h4 className="font-semibold text-slate-900">{record.label}</h4><p className="mt-1 text-sm text-slate-600"><span className="capitalize">{record.type}</span> · {record.source_name}{record.detail?` · ${record.detail}`:''}</p></div><time className="shrink-0 text-sm text-slate-500">{record.recorded_date}</time></article>)}{historyForTab.length===0&&<p className="py-10 text-center text-sm text-slate-500">No verified records have been shared for this patient.</p>}</div></section>
            )}
          </div>
        </main>

        
        {/* ZONE 4: RIGHT PANEL (Safety Panel) */}
        <aside className="w-80 shrink-0 bg-slate-50 border-l border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-200 font-bold text-xs uppercase tracking-wider text-slate-800 bg-amber-50 flex items-center justify-between">
            <span className="flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-amber-600"/> Safety Panel</span>
            <span className="bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">2</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase mb-2 block">Before you order (Search)</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Check prior labs (e.g. HbA1c)..." className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition shadow-sm" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase mb-2 block">Before you prescribe (Search)</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Check drug interactions..." className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition shadow-sm" />
              </div>
            </div>
            
            <hr className="border-slate-200" />
            
            <div className="space-y-4">
              <div className="p-3 bg-white border border-red-200 rounded-xl shadow-sm border-l-4 border-l-red-500">
                <div className="text-[10px] font-black tracking-wider text-red-800 uppercase mb-1">Interaction Alert</div>
                <div className="text-sm font-bold text-slate-800 mb-1">Aspirin + Ibuprofen</div>
                <div className="text-xs text-slate-600 mb-2 leading-relaxed">Increased risk of GI bleeding. Unified from Metro Diagnostics and Sanjeevani.</div>
                <div className="flex gap-2 mt-3">
                  <button className="text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-100 px-2.5 py-1.5 rounded transition">Acknowledge</button>
                  <button className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2.5 py-1.5 rounded transition">Modify Rx</button>
                </div>
              </div>

              <div className="p-3 bg-white border border-amber-200 rounded-xl shadow-sm border-l-4 border-l-amber-500">
                <div className="text-[10px] font-black tracking-wider text-amber-800 uppercase mb-1">Duplicate Therapy</div>
                <div className="text-sm font-bold text-slate-800 mb-1">Metformin (500mg & 1000mg)</div>
                <div className="text-xs text-slate-600 leading-relaxed">Patient has active scripts from two different providers.</div>
              </div>
            </div>

            <hr className="border-slate-200" />

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase mb-2 block">Quick Actions</label>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setShowReferralComposer(true)} className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-bold hover:bg-indigo-100 transition shadow-sm shadow-indigo-100">Refer Patient</button>

              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase mb-2 block">Before you prescribe</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Check interactions & allergies..." className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-emerald-600" />
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* BOTTOM ACTION BAR */}
      <footer className="shrink-0 h-16 bg-slate-900 flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-4 text-sm text-slate-400">
          <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-500"/> Draft Autosaved (1 min ago)</span>
          <span>|</span>
          <span className="flex items-center gap-1 cursor-pointer hover:text-white transition"><Edit3 className="w-4 h-4"/> 1 Note</span>
          <span className="flex items-center gap-1 cursor-pointer hover:text-white transition"><FilePlus className="w-4 h-4"/> 0 Rx</span>
        </div>
        <div className="flex gap-3">
          <button className="px-5 py-2 rounded-xl text-sm font-bold text-slate-300 hover:bg-slate-800 transition border border-slate-700">
            Save Draft & Exit
          </button>
          <button className="px-5 py-2 rounded-xl text-sm font-bold text-slate-900 bg-emerald-500 hover:bg-emerald-400 transition shadow-[0_0_15px_rgba(16,185,129,0.4)]">
            Sign & Complete Consult
          </button>
        </div>
      </footer>

      {/* PRESCRIPTION COMPOSER MODAL */}
      {showRxComposer && (
        <PrescriptionComposer 
          patientId={params.id} 
          onClose={() => setShowRxComposer(false)} 
          activeConditions={conditions} 
          activeAllergies={allergies} 
          activeMeds={medications}
        />
      )}

      {/* ORDER COMPOSER MODAL */}
      {showOrderComposer && (
        <OrderComposer 
          patientId={params.id} 
          onClose={() => setShowOrderComposer(false)} 
          activeLabs={labs} 
        />
      )}

      {/* NOTE EDITOR MODAL */}
      {showNoteEditor && (
        <NoteEditor 
          patientId={params.id} 
          onClose={() => setShowNoteEditor(false)} 
          activeVitals={vitals}
          activeMeds={medications}
        />
      )}

      {/* REFERRAL COMPOSER MODAL */}
      {showReferralComposer && (
        <ReferralComposer 
          patientId={params.id} 
          onClose={() => setShowReferralComposer(false)} 
        />
      )}
    </div>
  );
}
