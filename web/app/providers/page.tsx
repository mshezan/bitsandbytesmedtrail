'use client';

import { Stethoscope, Building2, AlertTriangle, Plus, Phone, MapPin, ExternalLink } from 'lucide-react';

const mockProviders = [
  { id: 1, name: 'Dr. Sarah Chen', type: 'Primary Care', facility: 'City Clinic', lastVisit: '2024-02-15', missing: true, phone: '(555) 123-4567' },
  { id: 2, name: 'Dr. James Wilson', type: 'Cardiologist', facility: 'UCSF Health', lastVisit: '2023-11-20', missing: false, phone: '(555) 987-6543' },
  { id: 3, name: 'Valley Hospital ER', type: 'Emergency Facility', facility: 'Valley Hospital', lastVisit: '2022-08-05', missing: true, phone: '(555) 555-0000' }
];

export default function Providers() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Care Team & Providers</h1>
          <p className="text-slate-500 mt-1">Manage the clinicians and facilities involved in your care.</p>
        </div>
        <button className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl transition font-medium w-max">
          <Plus className="h-4 w-4" />
          <span>Add Provider</span>
        </button>
      </header>

      {/* Missing Records Alert */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-4">
        <div className="bg-amber-100 p-2 rounded-full shrink-0">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-amber-900 font-semibold">Missing Records</h3>
          <p className="text-amber-700 text-sm mt-1">We detected past visits without corresponding clinical notes. Requesting these records ensures a complete history.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockProviders.map(provider => (
          <div key={provider.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col hover:border-emerald-200 transition">
            <div className="flex items-start gap-4 mb-4">
               <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                 {provider.type.includes('Facility') || provider.type.includes('ER') ? 
                   <Building2 className="h-6 w-6 text-slate-600" /> : 
                   <Stethoscope className="h-6 w-6 text-slate-600" />}
               </div>
               <div>
                 <h3 className="text-lg font-bold text-slate-800">{provider.name}</h3>
                 <p className="text-sm font-medium text-emerald-700">{provider.type}</p>
                 <p className="text-xs text-slate-500">{provider.facility}</p>
               </div>
            </div>
            
            <div className="mt-auto space-y-2 pt-4 border-t border-slate-100">
               <div className="flex items-center gap-2 text-sm text-slate-600">
                 <Phone className="h-4 w-4" /> {provider.phone}
               </div>
               <div className="flex items-center gap-2 text-sm text-slate-600">
                 <MapPin className="h-4 w-4" /> View Map
               </div>
               <div className="flex items-center justify-between mt-4">
                  <div className="text-xs text-slate-500">Last visit: {provider.lastVisit}</div>
               </div>
            </div>

            {provider.missing && (
              <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-800">
                  <AlertTriangle className="h-4 w-4" />
                  Missing Records
                </div>
                <button className="text-xs bg-white text-amber-700 border border-amber-200 px-2 py-1 rounded shadow-sm hover:bg-amber-100">Request</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
