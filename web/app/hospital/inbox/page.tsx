"use client";

import { useEffect, useState } from "react";
import { fetchAPI } from "@/lib/api";
import { AlertTriangle, CheckCircle, Clock, FileText, Bell, Search, Activity, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function InboxPage() {
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("results");
  const router = useRouter();

  const loadData = () => {
    fetchAPI('/hospital/inbox').then(setData).catch(console.error);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAcknowledge = async (id: string) => {
    try {
      await fetchAPI(`/hospital/inbox/${id}/acknowledge`, { method: "POST" });
      // update local state
      setData((prev:any) => ({
        ...prev,
        results: prev.results.map((r:any) => r.id === id ? { ...r, acknowledged: true } : r)
      }));
    } catch (e) {
      alert("Failed to acknowledge");
    }
  };

  if (!data) return <div className="p-8 text-slate-500 animate-pulse">Loading Inbox...</div>;

  return (
    <div className="flex flex-col h-screen">
      <header className="px-8 py-6 border-b border-slate-200 bg-white shrink-0">
        <h1 className="text-3xl font-bold text-slate-900">Inbox & Orders</h1>
        <p className="text-slate-500 mt-2">Manage incoming results, orders, and clinical tasks.</p>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Nav */}
        <div className="w-64 border-r border-slate-200 bg-slate-50 p-4 shrink-0">
          <button 
            onClick={() => setActiveTab('results')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold mb-2 transition ${activeTab === 'results' ? 'bg-white shadow-sm border border-slate-200 text-slate-900' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <span className="flex items-center gap-2"><Bell className="w-4 h-4"/> Results Inbox</span>
            {data.results.filter((r:any) => !r.acknowledged).length > 0 && (
              <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs">{data.results.filter((r:any) => !r.acknowledged).length}</span>
            )}
          </button>
          
          <button 
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition ${activeTab === 'orders' ? 'bg-white shadow-sm border border-slate-200 text-slate-900' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <span className="flex items-center gap-2"><FileText className="w-4 h-4"/> My Orders</span>
          </button>

          <button 
            onClick={() => setActiveTab('corrections')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition ${activeTab === 'corrections' ? 'bg-white shadow-sm border border-slate-200 text-slate-900' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <span className="flex items-center gap-2"><AlertTriangle className="w-4 h-4"/> Corrections</span>
            {data.corrections?.filter((c:any) => c.status === 'pending').length > 0 && (
              <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs">{data.corrections.filter((c:any) => c.status === 'pending').length}</span>
            )}
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 bg-white">
          {activeTab === 'results' && (
            <div className="max-w-5xl space-y-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">Critical & Abnormal Results</h2>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input type="text" placeholder="Filter results..." className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:border-blue-500 outline-none" />
                </div>
              </div>

              {data.results.map((r: any) => (
                <div key={r.id} className={`p-5 rounded-2xl border transition shadow-sm flex items-start gap-4 ${r.acknowledged ? 'bg-slate-50 border-slate-200 opacity-60' : r.flag === 'critical' ? 'bg-red-50/50 border-red-200' : 'bg-amber-50/50 border-amber-200'}`}>
                  <div className={`mt-1 p-2 rounded-full ${r.flag === 'critical' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                    {r.flag === 'critical' ? <AlertTriangle className="w-5 h-5"/> : <Activity className="w-5 h-5"/>}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                          {r.patient_name} 
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${r.flag === 'critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                            {r.flag}
                          </span>
                        </h3>
                        <p className="text-sm text-slate-500">Test: <strong>{r.test}</strong> • {r.date}</p>
                      </div>
                      {!r.acknowledged && (
                        <button onClick={() => handleAcknowledge(r.id)} className="px-4 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition">
                          Acknowledge
                        </button>
                      )}
                    </div>

                    <div className="mt-4 flex items-center gap-8 p-4 bg-white rounded-xl border border-slate-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
                      <div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Current Result</div>
                        <div className={`text-xl font-bold ${r.flag === 'critical' ? 'text-red-600' : 'text-amber-600'}`}>{r.value}</div>
                      </div>
                      <div className="h-8 w-px bg-slate-200"></div>
                      <div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Previous</div>
                        <div className="text-lg font-bold text-slate-700">{r.previous_value || 'N/A'}</div>
                      </div>
                    </div>

                    {!r.acknowledged && (
                      <div className="mt-4 flex gap-2">
                        <button className="px-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-semibold text-slate-600 hover:bg-slate-50">Add Comment</button>
                        <button className="px-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-semibold text-slate-600 hover:bg-slate-50">Order Follow-up</button>
                        <button className="px-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-semibold text-slate-600 hover:bg-slate-50">Notify Patient</button>
                        <button onClick={() => router.push(`/hospital/patient/${r.patient_id}/consult`)} className="px-3 py-1.5 bg-slate-800 text-white rounded text-xs font-semibold hover:bg-slate-900 ml-auto">
                          Open Chart &rarr;
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="max-w-5xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">Order Management</h2>
                <div className="flex gap-2">
                  <select className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white outline-none">
                    <option>All Statuses</option><option>Pending</option><option>Completed</option>
                  </select>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Order ID</th>
                      <th className="px-6 py-3 font-semibold">Patient</th>
                      <th className="px-6 py-3 font-semibold">Test / Procedure</th>
                      <th className="px-6 py-3 font-semibold">Status</th>
                      <th className="px-6 py-3 font-semibold">Priority</th>
                      <th className="px-6 py-3 font-semibold text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.orders.map((o:any) => (
                      <tr key={o.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-mono text-slate-500">{o.id}</td>
                        <td className="px-6 py-4 font-bold text-slate-900">{o.patient_name}</td>
                        <td className="px-6 py-4 text-slate-700">{o.test}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${o.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {o.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded border text-xs font-semibold ${o.priority === 'urgent' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                            {o.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-right">{o.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

          {activeTab === 'corrections' && (
            <div className="max-w-5xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">Patient Correction Requests</h2>
                <p className="text-sm text-slate-500">Identity corrections require admin approval.</p>
              </div>

              <div className="space-y-4">
                {data.corrections?.map((c:any) => (
                  <div key={c.id} className="p-6 rounded-2xl border border-amber-200 bg-amber-50/30 shadow-sm flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="bg-amber-100 text-amber-800 text-[10px] uppercase font-bold px-2 py-1 rounded">Pending Review</span>
                        <h3 className="font-bold text-slate-900 mt-2">{c.patient_name}</h3>
                        <p className="text-sm text-slate-500">Submitted: {c.date}</p>
                      </div>
                      <button className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">Open Chart</button>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] grid grid-cols-2 gap-6">
                      <div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Disputed Record / Field</div>
                        <div className="text-sm font-medium text-slate-800">{c.disputed_field}</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Patient's Comment</div>
                        <div className="text-sm text-slate-700 italic">"{c.patient_comment}"</div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition">Accept & Amend</button>
                      <button className="px-5 py-2 bg-white border border-rose-200 text-rose-600 rounded-xl font-bold text-sm hover:bg-rose-50 transition">Reject (Requires Reason)</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

      </div>
    </div>
  );
}
