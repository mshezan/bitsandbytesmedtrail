'use client';

import { useState } from 'react';
import { Shield, AlertTriangle, FileText, CheckCircle2, Search, Upload, Plus, Pill, FlaskConical, Activity, History } from 'lucide-react';

export default function ClinicianWorkspace({ params }: { params: { token: string } }) {
  const [duplicateCheck, setDuplicateCheck] = useState('');
  const [interactionCheck, setInteractionCheck] = useState('');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Banner */}
      <div className="bg-emerald-700 text-white px-4 py-3 text-center text-sm font-medium flex items-center justify-center gap-2 sticky top-0 z-10 shadow-sm">
         <Shield className="h-4 w-4" /> Shared by Sarah Jenkins • Expires in 23h
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
           <div>
             <h1 className="text-3xl font-bold text-slate-900">Sarah Jenkins</h1>
             <p className="text-slate-600 mt-1 font-medium">34y Female • DOB: 1992-05-14</p>
           </div>
           <button className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition shadow-sm">
             Download Complete PDF
           </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* Left Column: Snapshot & Since Last Visit */}
           <div className="lg:col-span-2 space-y-6">
              
              {/* Snapshot */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                 <div className="p-4 border-b border-slate-100 bg-slate-50">
                    <h2 className="font-bold text-slate-800">Clinical Snapshot</h2>
                 </div>
                 <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div>
                         <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Active Conditions</h3>
                         <ul className="space-y-2">
                           <li className="flex items-start gap-2"><Activity className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" /><span className="text-sm font-medium">Hypertension</span></li>
                           <li className="flex items-start gap-2"><Activity className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" /><span className="text-sm font-medium">Type 2 Diabetes</span></li>
                         </ul>
                       </div>
                       <div>
                         <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Allergies</h3>
                         <ul className="space-y-2">
                           <li className="flex items-start gap-2 text-rose-700 bg-rose-50 px-2 py-1.5 rounded-md w-max border border-rose-100"><AlertTriangle className="h-4 w-4 shrink-0" /><span className="text-sm font-bold">Penicillin</span></li>
                           <li className="flex items-start gap-2 text-rose-700 bg-rose-50 px-2 py-1.5 rounded-md w-max border border-rose-100"><AlertTriangle className="h-4 w-4 shrink-0" /><span className="text-sm font-bold">Latex (Mild)</span></li>
                         </ul>
                       </div>
                    </div>
                    
                    <div className="border-t border-slate-100 pt-6">
                       <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Active Medications</h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="flex gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50">
                             <Pill className="h-5 w-5 text-slate-400 shrink-0" />
                             <div>
                               <div className="font-semibold text-sm text-slate-800">Amlodipine 10mg</div>
                               <div className="text-xs text-slate-500">Once daily</div>
                             </div>
                          </div>
                          <div className="flex gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50">
                             <Pill className="h-5 w-5 text-slate-400 shrink-0" />
                             <div>
                               <div className="font-semibold text-sm text-slate-800">Glycomet 500mg</div>
                               <div className="text-xs text-slate-500">Twice daily</div>
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="border-t border-slate-100 pt-6">
                       <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex justify-between">
                         Last 5 Labs <span className="text-emerald-600 cursor-pointer hover:underline lowercase font-medium">view all</span>
                       </h3>
                       <div className="overflow-x-auto">
                         <table className="w-full text-sm text-left">
                           <thead>
                             <tr className="text-slate-400">
                               <th className="pb-2 font-medium">Date</th>
                               <th className="pb-2 font-medium">Test</th>
                               <th className="pb-2 font-medium">Result</th>
                             </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100">
                             <tr><td className="py-2">Oct 05</td><td className="font-medium text-slate-700">HbA1c</td><td className="font-semibold">6.2 %</td></tr>
                             <tr><td className="py-2">Oct 05</td><td className="font-medium text-slate-700">Total Cholesterol</td><td className="font-semibold text-amber-600">210 mg/dL</td></tr>
                             <tr><td className="py-2">Sep 20</td><td className="font-medium text-slate-700">TSH</td><td className="font-semibold">2.1 mIU/L</td></tr>
                             <tr><td className="py-2">Aug 15</td><td className="font-medium text-slate-700">Creatinine</td><td className="font-semibold">0.9 mg/dL</td></tr>
                             <tr><td className="py-2">Aug 15</td><td className="font-medium text-slate-700">Potassium</td><td className="font-semibold">4.2 mEq/L</td></tr>
                           </tbody>
                         </table>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Since Last Visit */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                 <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><History className="h-5 w-5 text-emerald-600" /> Since Last Visit (3 mos ago)</h2>
                 <div className="space-y-4">
                    <div className="flex gap-4 p-4 rounded-xl bg-blue-50 border border-blue-100">
                       <FileText className="h-5 w-5 text-blue-600 shrink-0" />
                       <div>
                         <h4 className="font-semibold text-blue-900 text-sm">Urgent Care Visit: Valley Clinic</h4>
                         <p className="text-xs text-blue-800 mt-1">Diagnosed with mild bronchitis. Prescribed Azithromycin (completed).</p>
                         <div className="text-[10px] font-bold text-blue-600 uppercase mt-2">Sep 28, 2023</div>
                       </div>
                    </div>
                    <div className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                       <FlaskConical className="h-5 w-5 text-slate-600 shrink-0" />
                       <div>
                         <h4 className="font-semibold text-slate-900 text-sm">New Labs Available: Dr. Lal PathLabs</h4>
                         <p className="text-xs text-slate-600 mt-1">Lipid Panel completed.</p>
                         <div className="text-[10px] font-bold text-slate-500 uppercase mt-2">Oct 05, 2023</div>
                       </div>
                    </div>
                 </div>
              </div>

           </div>

           {/* Right Column: Tools & Handback */}
           <div className="space-y-6">
              
              {/* Checks */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                 <h2 className="font-bold text-slate-800 mb-4">Clinical Checks</h2>
                 
                 <div className="space-y-5">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Duplicate Test Check</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="e.g. Lipid Panel" 
                          value={duplicateCheck}
                          onChange={(e) => setDuplicateCheck(e.target.value)}
                          className="flex-1 p-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-emerald-500" 
                        />
                        <button className="bg-slate-100 p-2 rounded-lg hover:bg-slate-200 transition"><Search className="h-5 w-5 text-slate-600" /></button>
                      </div>
                      {duplicateCheck.toLowerCase().includes('lipid') && (
                         <div className="mt-2 text-xs text-rose-600 font-medium bg-rose-50 p-2 rounded border border-rose-100 flex items-start gap-1.5">
                           <AlertTriangle className="h-4 w-4 shrink-0" /> Alert: Lipid Panel was already performed on Oct 05, 2023.
                         </div>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Interaction Check</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="e.g. Ibuprofen" 
                          value={interactionCheck}
                          onChange={(e) => setInteractionCheck(e.target.value)}
                          className="flex-1 p-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-emerald-500" 
                        />
                        <button className="bg-slate-100 p-2 rounded-lg hover:bg-slate-200 transition"><Search className="h-5 w-5 text-slate-600" /></button>
                      </div>
                      {interactionCheck.toLowerCase().includes('ibuprofen') && (
                         <div className="mt-2 text-xs text-amber-600 font-medium bg-amber-50 p-2 rounded border border-amber-100 flex items-start gap-1.5">
                           <AlertTriangle className="h-4 w-4 shrink-0" /> Warning: Potential interaction with active medication Amlodipine.
                         </div>
                      )}
                    </div>
                 </div>
              </div>

              {/* Handback */}
              <div className="bg-white rounded-2xl shadow-sm border border-emerald-200 p-5 bg-emerald-50/30">
                 <h2 className="font-bold text-emerald-900 mb-2">Close the Loop</h2>
                 <p className="text-xs text-emerald-700 mb-4">Add your visit notes or upload a report to the patient's unified record.</p>
                 
                 <div className="space-y-3">
                   <textarea 
                     placeholder="Type visit summary..." 
                     rows={3} 
                     className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 bg-white resize-none"
                   ></textarea>
                   <button className="w-full flex justify-center items-center gap-2 py-2 border-2 border-dashed border-emerald-200 text-emerald-700 rounded-xl hover:bg-emerald-50 transition text-sm font-medium bg-white">
                     <Upload className="h-4 w-4" /> Upload PDF Report
                   </button>
                   <button className="w-full bg-emerald-600 text-white py-2 rounded-xl font-medium text-sm hover:bg-emerald-700 transition mt-2">
                     Submit to Patient Record
                   </button>
                 </div>
              </div>

           </div>
        </div>
      </div>
    </div>
  );
}
