'use client';

import { useState } from 'react';
import { Database, Plus, Search, Building2, FlaskConical, Stethoscope, ChevronRight, CheckCircle2, Server } from 'lucide-react';

const connectors = [
  { id: 'epic', name: 'Epic MyChart', type: 'Hospital', icon: Building2, status: 'Connected', lastSync: '2 hours ago' },
  { id: 'cerner', name: 'Cerner Health', type: 'Hospital', icon: Building2, status: 'Connected', lastSync: '1 day ago' },
  { id: 'quest', name: 'Quest Diagnostics', type: 'Lab', icon: FlaskConical, status: 'Connected', lastSync: '5 days ago' },
  { id: 'cvs', name: 'CVS Pharmacy', type: 'Pharmacy', icon: Plus, status: 'Not Connected', lastSync: null },
];

export default function ProviderConnect() {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
           <div>
             <div className="flex items-center gap-2 mb-1">
               <Database className="h-6 w-6 text-emerald-600" />
               <h1 className="text-2xl font-bold text-slate-900">Data Connections</h1>
             </div>
             <p className="text-slate-500 text-sm">Manage FHIR API connections and data sources.</p>
           </div>
           <button onClick={() => setWizardOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 text-sm shadow-sm">
             <Plus className="h-4 w-4" /> Add Source
           </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {connectors.map(c => (
             <div key={c.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${c.status === 'Connected' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                    <c.icon className="h-6 w-6" />
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${c.status === 'Connected' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {c.status}
                  </span>
                </div>
                <h3 className="font-bold text-slate-800 text-lg">{c.name}</h3>
                <p className="text-sm font-medium text-slate-500">{c.type}</p>
                
                <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                   <div className="text-xs text-slate-400">
                     {c.lastSync ? `Last synced: ${c.lastSync}` : 'Never synced'}
                   </div>
                   <button className="text-emerald-600 text-sm font-medium hover:text-emerald-700">Configure</button>
                </div>
             </div>
           ))}
        </div>

        {/* FHIR Schema Info Panel */}
        <div className="bg-slate-900 text-slate-300 rounded-2xl p-6 md:p-8 font-mono text-sm overflow-hidden relative">
          <div className="absolute right-0 top-0 p-8 opacity-10 pointer-events-none">
            <Server className="h-48 w-48" />
          </div>
          <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2 tracking-tight font-sans">
             Internal FHIR Mapping Schema
          </h2>
          <p className="mb-6 max-w-2xl text-slate-400 font-sans text-sm">
             Incoming records are mapped to standard FHIR R4 resources. Duplicate resolution uses deduplication algorithms based on coding systems (RxNorm, LOINC, SNOMED CT).
          </p>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-x-auto">
<pre><code>{`{
  "resourceType": "Bundle",
  "type": "collection",
  "entry": [
    {
      "resource": {
        "resourceType": "Patient",
        "id": "unified-123",
        "identifier": [{"system": "urn:oid:2.16.840.1.113883.4.1", "value": "..."}]
      }
    },
    {
      "resource": {
        "resourceType": "MedicationRequest",
        "medicationCodeableConcept": {
          "coding": [{"system": "http://www.nlm.nih.gov/research/umls/rxnorm", "code": "206263"}]
        },
        "status": "active"
      }
    }
  ]
}`}</code></pre>
          </div>
        </div>
      </div>

      {/* Add Source Wizard Modal */}
      {wizardOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-800">Add Data Source</h3>
                <button onClick={() => setWizardOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>
              
              <div className="p-6 overflow-y-auto">
                 {wizardStep === 1 && (
                   <div className="space-y-4">
                     <div className="relative">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                       <input type="text" placeholder="Search for your provider or hospital..." className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 bg-slate-50" />
                     </div>
                     <div className="space-y-2 mt-4">
                        <div onClick={() => setWizardStep(2)} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition">
                           <div className="flex items-center gap-3">
                             <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold text-xs">UCLA</div>
                             <div>
                               <div className="font-bold text-slate-800 text-sm">UCLA Health</div>
                               <div className="text-xs text-slate-500">Hospital System</div>
                             </div>
                           </div>
                           <ChevronRight className="h-5 w-5 text-slate-400" />
                        </div>
                     </div>
                   </div>
                 )}

                 {wizardStep === 2 && (
                   <div className="space-y-6 text-center py-4">
                      <div className="h-16 w-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto text-xl font-bold">UCLA</div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-lg">Connect to UCLA Health</h4>
                        <p className="text-sm text-slate-500 mt-2">You will be redirected to UCLA Health's secure portal to authorize MedTrail to access your medical records.</p>
                      </div>
                      <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-lg text-left font-medium">
                        MedTrail will only access your records, and cannot modify data at your provider.
                      </div>
                      <button onClick={() => setWizardStep(3)} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition shadow-sm">
                        Proceed to Login
                      </button>
                   </div>
                 )}

                 {wizardStep === 3 && (
                   <div className="space-y-6 text-center py-8">
                      <div className="h-20 w-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                         <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                      </div>
                      <h4 className="font-bold text-slate-800 text-xl">Connection Successful</h4>
                      <p className="text-slate-500 text-sm">MedTrail is now syncing your records from UCLA Health. This may take a few minutes.</p>
                      <button onClick={() => {setWizardOpen(false); setWizardStep(1)}} className="bg-slate-100 text-slate-700 py-3 px-6 rounded-xl font-bold hover:bg-slate-200 transition">
                        Done
                      </button>
                   </div>
                 )}
              </div>
           </div>
        </div>
      )}

    </div>
  );
}
