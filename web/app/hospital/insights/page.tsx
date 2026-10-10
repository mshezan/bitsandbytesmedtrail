"use client";
import { useEffect, useState } from "react";
import { fetchAPI } from "@/lib/api";
import { AlertTriangle, ChevronRight, Filter, Search } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PopulationInsights() {
  const [data, setData] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetchAPI('/hospital/insights/population').then(setData).catch(console.error);
  }, []);

  return (
    <div className="flex flex-col h-screen">
      <header className="px-8 py-6 border-b border-slate-200 bg-white shrink-0">
        <h1 className="text-3xl font-bold text-slate-900">Active Alerts</h1>
        <p className="text-slate-500 mt-2">Network-wide risk stratification and proactive clinical alerts across all your patients.</p>
      </header>

      <div className="flex-1 p-8 bg-slate-50 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 flex items-center gap-2 shadow-sm"><Filter className="w-4 h-4"/> Filter by Risk</button>
              <button className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 shadow-sm">Overdue Tests</button>
              <button className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 shadow-sm">Interactions</button>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input type="text" placeholder="Search patients..." className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:border-indigo-500 outline-none w-64 shadow-sm" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">Risk Level</th>
                  <th className="px-6 py-4 font-semibold">Patient</th>
                  <th className="px-6 py-4 font-semibold">Insight Type</th>
                  <th className="px-6 py-4 font-semibold">Clinical Detail</th>
                  <th className="px-6 py-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((row:any, i:number) => (
                  <tr key={i} className="hover:bg-slate-50 transition group">
                    <td className="px-6 py-4">
                      <span className={`flex items-center gap-1.5 font-bold text-xs px-2.5 py-1 rounded-full w-fit ${row.risk === 'High' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        <AlertTriangle className="w-3 h-3"/> {row.risk}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">{row.patient}</td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{row.type}</td>
                    <td className="px-6 py-4 text-slate-600">{row.detail}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => router.push(`/hospital/patient/${row.patient_id}/consult`)} className="text-indigo-600 font-bold hover:underline flex items-center justify-end gap-1 w-full">
                        Open Chart <ChevronRight className="w-4 h-4"/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
}
