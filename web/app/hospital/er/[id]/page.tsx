"use client";
import { ShieldAlert, Activity, FileText, ArrowLeft, HeartPulse, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ERCriticalView() {
  const router = useRouter();

  return (
    <div className="h-screen bg-slate-900 text-white flex flex-col overflow-hidden">
      <header className="px-6 py-4 border-b border-slate-800 bg-red-950/30 flex justify-between items-center shrink-0">
        <button onClick={() => router.back()} className="text-slate-400 hover:text-white transition flex items-center gap-2"><ArrowLeft className="w-5 h-5"/> Back to Triage</button>
        <div className="flex items-center gap-2 text-red-500 font-bold bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20">
          <ShieldAlert className="w-5 h-5" /> BREAK-GLASS EMERGENCY ACCESS LOGGED
        </div>
      </header>

      <div className="flex-1 flex flex-col">
        <div className="p-8 bg-slate-800/50 border-b border-slate-800">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-5xl font-black tracking-tight mb-2">Priya Sharma</h1>
              <p className="text-2xl text-slate-400">47y • Female • ABHA: <span className="font-mono text-slate-300">91-XXXX-XXXX-XXXX</span></p>
            </div>
            <div className="text-right">
              <div className="text-5xl font-black text-red-500">O+</div>
              <p className="text-xl text-slate-400 mt-1">Blood Group</p>
            </div>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-8 p-8 overflow-y-auto">
          
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-red-400 mb-4 flex items-center gap-2"><ShieldAlert /> CRITICAL ALLERGIES</h2>
              <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl">
                <ul className="text-3xl font-bold text-red-400 space-y-2 list-disc pl-8">
                  <li>Penicillin (Anaphylaxis)</li>
                  <li>Sulfa Drugs (Rash)</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-amber-400 mb-4 flex items-center gap-2"><Activity /> ACTIVE CONDITIONS</h2>
              <div className="bg-slate-800 p-6 rounded-2xl">
                <ul className="text-2xl font-medium text-slate-200 space-y-2 list-disc pl-8">
                  <li>Type 2 Diabetes Mellitus</li>
                  <li>Hypertension</li>
                  <li>Hypothyroidism</li>
                </ul>
              </div>
            </section>
          </div>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-blue-400 mb-4 flex items-center gap-2"><HeartPulse /> ACTIVE MEDICATIONS</h2>
              <div className="bg-slate-800 p-6 rounded-2xl">
                <ul className="text-xl text-slate-200 space-y-4">
                  <li className="flex justify-between border-b border-slate-700 pb-2">
                    <span className="font-bold">Glycomet (Metformin)</span>
                    <span className="text-slate-400">1000mg</span>
                  </li>
                  <li className="flex justify-between border-b border-slate-700 pb-2">
                    <span className="font-bold">Telmisartan</span>
                    <span className="text-slate-400">40mg</span>
                  </li>
                  <li className="flex justify-between border-b border-slate-700 pb-2">
                    <span className="font-bold text-red-400">Aspirin (Ecosprin)</span>
                    <span className="text-slate-400">75mg</span>
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-emerald-400 mb-4 flex items-center gap-2"><Clock /> EMERGENCY CONTACTS</h2>
              <div className="bg-slate-800 p-6 rounded-2xl">
                <div className="text-xl">
                  <div className="font-bold">Rajesh Sharma (Husband)</div>
                  <div className="text-slate-400 font-mono mt-1">+91 98765 43210</div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
