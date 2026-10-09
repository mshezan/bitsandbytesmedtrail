'use client';

import { useState } from 'react';
import { Pill, AlertTriangle, Search, Filter, AlertCircle, FileWarning, Clock } from 'lucide-react';

const reconciledMeds = [
  { id: 1, name: 'Lisinopril', dose: '10mg', freq: 'Once daily', sources: ['UCSF Health', 'CVS Pharmacy'], status: 'Reconciled', timeline: 'Active since 2021', conflict: null },
  { id: 2, name: 'Losartan', dose: '50mg', freq: 'Once daily', sources: ['City Clinic'], status: 'Conflict', timeline: 'Added 2 days ago', conflict: { type: 'duplicate', message: 'Therapeutic duplication with Lisinopril. Both are blood pressure medications.', severity: 'high' } },
  { id: 3, name: 'Atorvastatin', dose: '20mg', freq: 'Once daily at night', sources: ['UCSF Health'], status: 'Reconciled', timeline: 'Active since 2022', conflict: { type: 'mismatch', message: 'Dose differs across sources (20mg vs 40mg).', severity: 'medium' } },
  { id: 4, name: 'Ibuprofen', dose: '400mg', freq: 'As needed for pain', sources: ['Patient Reported'], status: 'Reconciled', timeline: 'Active', conflict: { type: 'interaction', message: 'May reduce effectiveness of Lisinopril.', severity: 'medium' } },
];

export default function Medications() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Medication Reconciliation</h1>
          <p className="text-slate-500 mt-1">Unified list compiled from your connected healthcare sources.</p>
        </div>
      </header>

      {/* Warnings Banner */}
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-4">
        <div className="bg-rose-100 p-2 rounded-full shrink-0">
          <AlertTriangle className="h-5 w-5 text-rose-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-rose-900 font-semibold">Conflicts Detected</h3>
          <p className="text-rose-700 text-sm mt-1">There are conflicting records across your connected sources that require your attention.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search medications..." 
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 font-medium text-sm hover:bg-slate-50 transition w-full md:w-auto">
            <Filter className="h-4 w-4" />
            Filter
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {reconciledMeds.map(med => (
            <div key={med.id} className={`p-4 md:p-6 transition ${med.conflict && med.conflict.severity === 'high' ? 'bg-rose-50/30' : 'hover:bg-slate-50'}`}>
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 ${med.conflict && med.conflict.severity === 'high' ? 'bg-rose-100' : 'bg-slate-100'}`}>
                    <Pill className={`h-6 w-6 ${med.conflict && med.conflict.severity === 'high' ? 'text-rose-600' : 'text-slate-600'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-800">{med.name}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${med.conflict && med.conflict.severity === 'high' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {med.status}
                      </span>
                    </div>
                    <p className="text-slate-600 font-medium mt-1">{med.dose} • {med.freq}</p>
                    
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {med.sources.map((source, i) => (
                        <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded font-medium border border-slate-200">
                          {source}
                        </span>
                      ))}
                    </div>
                    
                    {med.conflict && (
                      <div className={`mt-3 p-3 rounded-lg border flex gap-3 items-start ${med.conflict.severity === 'high' ? 'bg-rose-50 border-rose-200' : 'bg-amber-50 border-amber-200'}`}>
                        {med.conflict.type === 'duplicate' && <FileWarning className={`h-5 w-5 shrink-0 ${med.conflict.severity === 'high' ? 'text-rose-600' : 'text-amber-600'}`} />}
                        {med.conflict.type === 'mismatch' && <AlertCircle className={`h-5 w-5 shrink-0 ${med.conflict.severity === 'high' ? 'text-rose-600' : 'text-amber-600'}`} />}
                        {med.conflict.type === 'interaction' && <AlertTriangle className={`h-5 w-5 shrink-0 ${med.conflict.severity === 'high' ? 'text-rose-600' : 'text-amber-600'}`} />}
                        
                        <div className="flex-1">
                          <h4 className={`text-sm font-semibold capitalize ${med.conflict.severity === 'high' ? 'text-rose-900' : 'text-amber-900'}`}>
                            {med.conflict.type} Warning
                          </h4>
                          <p className={`text-sm mt-0.5 ${med.conflict.severity === 'high' ? 'text-rose-700' : 'text-amber-700'}`}>
                            {med.conflict.message}
                          </p>
                        </div>
                        <button className="text-xs font-semibold px-3 py-1.5 bg-white border border-slate-200 rounded-md shadow-sm hover:bg-slate-50 transition shrink-0">
                          Resolve
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-4 md:mt-0 text-sm text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                  <Clock className="h-4 w-4" />
                  {med.timeline}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
