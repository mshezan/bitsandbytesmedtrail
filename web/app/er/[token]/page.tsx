'use client';

import { AlertTriangle, Activity, Pill, Droplet, ShieldAlert } from 'lucide-react';

export default function EmergencyAccess({ params }: { params: { token: string } }) {
  return (
    <div className="min-h-screen bg-rose-600 text-white flex flex-col p-4 md:p-8">
      
      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full">
        
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
           <div className="flex items-center gap-2 text-rose-100 font-bold tracking-widest uppercase">
             <ShieldAlert className="h-6 w-6" /> EMERGENCY ACCESS
           </div>
           <div className="bg-white p-1 rounded-lg shrink-0">
             <div className="h-12 w-12 bg-slate-900 rounded flex items-center justify-center text-xs font-mono text-white text-center leading-tight">
               QR<br/>CODE
             </div>
           </div>
        </header>

        {/* Main Card */}
        <div className="bg-white text-slate-900 rounded-3xl p-6 md:p-8 shadow-2xl flex-1 flex flex-col">
           
           <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-100 pb-6 mb-6">
             <div>
               <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Sarah Jenkins</h1>
               <p className="text-lg text-slate-500 font-medium mt-1">34y Female • DOB: 1992-05-14</p>
             </div>
             <div className="mt-4 md:mt-0 flex items-center gap-3 bg-rose-50 px-4 py-2 rounded-2xl border border-rose-100 w-max">
                <Droplet className="h-6 w-6 text-rose-600 fill-rose-600" />
                <div>
                  <div className="text-xs font-bold text-rose-800 uppercase tracking-widest">Blood Type</div>
                  <div className="text-2xl font-black text-rose-600 leading-none">O Negative</div>
                </div>
             </div>
           </div>

           <div className="space-y-8 flex-1">
             
             {/* Allergies */}
             <div>
               <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                 <AlertTriangle className="h-4 w-4" /> Critical Allergies
               </h2>
               <div className="flex flex-wrap gap-3">
                 <div className="bg-rose-100 border border-rose-200 text-rose-800 px-4 py-2 rounded-xl font-bold text-lg">Penicillin (Anaphylaxis)</div>
                 <div className="bg-rose-100 border border-rose-200 text-rose-800 px-4 py-2 rounded-xl font-bold text-lg">Latex (Contact Dermatitis)</div>
               </div>
             </div>

             {/* Conditions */}
             <div>
               <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                 <Activity className="h-4 w-4" /> Active Conditions
               </h2>
               <div className="flex flex-wrap gap-2">
                 <span className="bg-slate-100 text-slate-800 px-3 py-1.5 rounded-lg font-semibold">Hypertension</span>
                 <span className="bg-slate-100 text-slate-800 px-3 py-1.5 rounded-lg font-semibold">Type 2 Diabetes</span>
                 <span className="bg-slate-100 text-slate-800 px-3 py-1.5 rounded-lg font-semibold">Asthma</span>
               </div>
             </div>

             {/* Medications */}
             <div>
               <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                 <Pill className="h-4 w-4" /> Active Medications
               </h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                 <div className="p-3 border border-slate-200 rounded-xl">
                   <div className="font-bold text-slate-800">Lisinopril 10mg</div>
                   <div className="text-sm text-slate-500">Once daily</div>
                 </div>
                 <div className="p-3 border border-slate-200 rounded-xl">
                   <div className="font-bold text-slate-800">Metformin 500mg</div>
                   <div className="text-sm text-slate-500">Twice daily</div>
                 </div>
                 <div className="p-3 border border-slate-200 rounded-xl">
                   <div className="font-bold text-slate-800">Albuterol Inhaler</div>
                   <div className="text-sm text-slate-500">As needed</div>
                 </div>
               </div>
             </div>

           </div>

           <div className="mt-8 pt-6 border-t border-slate-100 text-center">
             <button className="bg-slate-900 text-white font-bold px-8 py-4 rounded-xl text-lg hover:bg-slate-800 transition shadow-lg w-full md:w-auto">
               View Full Medical Record
             </button>
             <p className="text-xs font-medium text-slate-400 mt-4">Authorized emergency personnel only. Access to this record is logged and monitored.</p>
           </div>
        </div>

      </div>

      <footer className="text-center mt-8 text-rose-200 text-sm font-medium opacity-80">
        Access logged. IP: 192.168.1.1 • {new Date().toLocaleString()}
      </footer>

    </div>
  );
}
