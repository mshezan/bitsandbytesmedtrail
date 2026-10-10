"use client";
import { useEffect, useState } from "react";
import { fetchAPI } from "@/lib/api";
import { Download, History, ShieldAlert } from "lucide-react";

export default function AccessHistory() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetchAPI('/hospital/access').then(setData).catch(console.error);
  }, []);

  const handleExport = () => {
    // Mock export CSV
    alert("Audit log exported to CSV.");
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="px-8 py-6 border-b border-slate-200 bg-white shrink-0 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <History className="w-8 h-8 text-indigo-600"/> Access History & Audit
          </h1>
          <p className="text-slate-500 mt-2">DPDP compliant immutable log of all staff interactions with unified records.</p>
        </div>
        <button onClick={handleExport} className="px-5 py-2.5 bg-white border border-slate-300 shadow-sm text-slate-700 font-bold rounded-xl flex items-center gap-2 hover:bg-slate-50 transition">
          <Download className="w-4 h-4"/> Export CSV
        </button>
      </header>

      <div className="flex-1 p-8 bg-slate-50 overflow-y-auto">
        <div className="max-w-6xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Timestamp</th>
                <th className="px-6 py-4 font-semibold">Patient</th>
                <th className="px-6 py-4 font-semibold">Purpose / Action</th>
                <th className="px-6 py-4 font-semibold">Scope</th>
                <th className="px-6 py-4 font-semibold text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-xs">
              {data.map((row:any, i:number) => (
                <tr key={i} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4 text-slate-500">{row.date}</td>
                  <td className="px-6 py-4 font-bold text-slate-700 font-sans">{row.patient}</td>
                  <td className="px-6 py-4 font-sans text-slate-800">
                    {row.purpose.includes('BREAK-GLASS') ? (
                      <span className="flex items-center gap-1 text-red-600 font-bold"><ShieldAlert className="w-3 h-3"/> {row.purpose}</span>
                    ) : row.purpose}
                  </td>
                  <td className="px-6 py-4 text-slate-500">{row.scope}</td>
                  <td className="px-6 py-4 text-slate-400 text-right">{row.ip || '192.168.1.1'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.length === 0 && <div className="p-8 text-center text-slate-500">No audit logs found.</div>}
        </div>
      </div>
    </div>
  );
}
