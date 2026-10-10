"use client";
import { Bed, Activity, UserPlus, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function InpatientsBoard() {
  const router = useRouter();

  return (
    <div className="flex flex-col h-screen">
      <header className="px-8 py-6 border-b border-slate-200 bg-white shrink-0 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Inpatient Wards</h1>
          <p className="text-slate-500 mt-2">Manage admissions, transfers, and discharges.</p>
        </div>
        <button className="px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-slate-800 transition">
          <UserPlus className="w-5 h-5"/> New Admission
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-8 bg-slate-50 space-y-8">
        
        <section>
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2"><Bed className="text-blue-600"/> General Ward A</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <span className="bg-slate-100 text-slate-600 font-bold px-2 py-1 rounded text-xs">Bed A-12</span>
                <span className="bg-amber-100 text-amber-700 font-bold px-2 py-1 rounded text-xs">Day 3</span>
              </div>
              <h3 className="font-bold text-lg text-slate-900">Ramesh Iyer</h3>
              <p className="text-sm text-slate-500 mb-4">Admitted: Dengue Fever</p>
              <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                <div className="text-xs text-slate-500 flex items-center gap-1"><Activity className="w-3 h-3 text-emerald-500"/> Stable</div>
                <button className="text-sm font-bold text-blue-600 hover:underline">Daily Notes</button>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm border-l-4 border-l-emerald-500">
              <div className="flex justify-between items-start mb-3">
                <span className="bg-slate-100 text-slate-600 font-bold px-2 py-1 rounded text-xs">Bed A-14</span>
                <span className="bg-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded text-xs">Ready for Discharge</span>
              </div>
              <h3 className="font-bold text-lg text-slate-900">Priya Sharma</h3>
              <p className="text-sm text-slate-500 mb-4">Admitted: Observation</p>
              <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                <div className="text-xs text-slate-500">Pending Summary</div>
                <button onClick={() => router.push('/hospital/patient/f135b91a-1286-455b-bb68-ec7b4f53ec38/consult')} className="text-sm font-bold text-emerald-600 hover:underline">Build Summary &rarr;</button>
              </div>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}
