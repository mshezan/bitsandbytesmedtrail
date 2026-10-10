"use client";
import { useState, useEffect } from "react";
import { fetchAPI } from "@/lib/api";
import { FileText, Calendar } from "lucide-react";

export default function RecordsPage() {
  const [records, setRecords] = useState<any[]>([]);

  useEffect(() => {
    // We fetch timeline data for now as a proxy for all records
    fetchAPI('/timeline').then(data => setRecords(data.events || [])).catch(console.error);
  }, []);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-800 mb-6">All Records</h1>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-semibold text-slate-600">Date</th>
              <th className="px-6 py-4 font-semibold text-slate-600">Type</th>
              <th className="px-6 py-4 font-semibold text-slate-600">Source</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map((r, i) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="px-6 py-4 text-slate-600">{r.date}</td>
                <td className="px-6 py-4 font-medium capitalize">{r.type}</td>
                <td className="px-6 py-4 text-slate-500">{r.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
