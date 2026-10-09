'use client';

import { useState } from 'react';
import { Share2, Clock, Lock, Key, CheckCircle2, ChevronRight, Copy, History, ShieldAlert } from 'lucide-react';

export default function ShareAccess() {
  const [step, setStep] = useState(1);
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Share & Access</h1>
        <p className="text-slate-500 mt-1">Provide secure, temporary access to your unified records.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
             <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
               <Share2 className="h-5 w-5 text-emerald-600" /> Create Access Link
             </h2>
             
             {/* 3-Step Flow */}
             <div className="space-y-8 relative">
                {/* Connecting lines for steps */}
                <div className="absolute left-[15px] top-6 bottom-6 w-0.5 bg-slate-100 -z-10"></div>
                
                {/* Step 1 */}
                <div className="flex gap-4">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 z-10 ${step >= 1 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>1</div>
                  <div className="flex-1">
                    <h3 className={`font-semibold ${step >= 1 ? 'text-slate-800' : 'text-slate-400'}`}>Select Scope</h3>
                    {step === 1 && (
                      <div className="mt-4 space-y-3">
                         <label className="flex items-center gap-3 p-3 border border-emerald-500 bg-emerald-50 rounded-xl cursor-pointer">
                           <input type="radio" name="scope" defaultChecked className="text-emerald-600" />
                           <div>
                             <div className="font-semibold text-sm">Full Medical History</div>
                             <div className="text-xs text-slate-500">Conditions, meds, allergies, labs, notes.</div>
                           </div>
                         </label>
                         <label className="flex items-center gap-3 p-3 border border-slate-200 hover:border-slate-300 rounded-xl cursor-pointer">
                           <input type="radio" name="scope" className="text-emerald-600" />
                           <div>
                             <div className="font-semibold text-sm">Medications & Allergies Only</div>
                             <div className="text-xs text-slate-500">Just safety-critical information.</div>
                           </div>
                         </label>
                         <button onClick={() => setStep(2)} className="mt-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition">Continue</button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-4">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 z-10 ${step >= 2 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>2</div>
                  <div className="flex-1">
                    <h3 className={`font-semibold ${step >= 2 ? 'text-slate-800' : 'text-slate-400'}`}>Set Duration & Security</h3>
                    {step === 2 && (
                      <div className="mt-4 space-y-4">
                         <div className="grid grid-cols-2 gap-3">
                            <label className="block text-sm font-medium text-slate-700">
                              Expires in
                              <select className="mt-1 w-full p-2 border border-slate-200 rounded-lg outline-none">
                                <option>24 Hours</option>
                                <option>7 Days</option>
                              </select>
                            </label>
                            <label className="block text-sm font-medium text-slate-700">
                              Access PIN (Optional)
                              <input type="text" placeholder="e.g. 1234" className="mt-1 w-full p-2 border border-slate-200 rounded-lg outline-none" />
                            </label>
                         </div>
                         <button onClick={() => setStep(3)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition">Generate Link</button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-4">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 z-10 ${step >= 3 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>3</div>
                  <div className="flex-1">
                    <h3 className={`font-semibold ${step >= 3 ? 'text-slate-800' : 'text-slate-400'}`}>Share</h3>
                    {step === 3 && (
                      <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                         <div className="flex items-center gap-2 text-emerald-700 font-medium text-sm">
                           <CheckCircle2 className="h-5 w-5" /> Link generated successfully
                         </div>
                         <div className="flex gap-2">
                           <input type="text" readOnly value="https://medtrail.app/shared/abc-123" className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-sm" />
                           <button className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100"><Copy className="h-5 w-5" /></button>
                         </div>
                         <button onClick={() => setStep(1)} className="text-sm font-medium text-slate-500 hover:text-slate-700">Create another</button>
                      </div>
                    )}
                  </div>
                </div>

             </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
               <History className="h-5 w-5 text-slate-500" /> Access Log
            </h2>
            <div className="space-y-4">
               {[
                 { name: 'Dr. Sarah Chen', time: 'Today, 2:30 PM', scope: 'Full History' },
                 { name: 'Valley Hospital ER', time: 'Oct 1, 2023', scope: 'Emergency Card' },
                 { name: 'City Clinic Staff', time: 'Sep 15, 2023', scope: 'Meds & Allergies' }
               ].map((log, i) => (
                 <div key={i} className="flex flex-col gap-1 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                    <div className="font-semibold text-slate-800 text-sm">{log.name}</div>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>{log.scope}</span>
                      <span>{log.time}</span>
                    </div>
                 </div>
               ))}
            </div>
            <button className="w-full mt-4 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition">View Full History</button>
          </div>
        </div>
      </div>
    </div>
  );
}
