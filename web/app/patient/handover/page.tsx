'use client';

import { useState } from 'react';
import { Send, FileText, CheckCircle2, ChevronRight, FileDown, Lock } from 'lucide-react';

export default function Handover() {
  const [step, setStep] = useState(1);
  const [selectedSections, setSelectedSections] = useState({
    conditions: true,
    medications: true,
    allergies: true,
    labs: false,
    notes: false
  });

  const toggleSection = (key: keyof typeof selectedSections) => {
    setSelectedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header className="text-center mb-8">
        <div className="h-16 w-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Send className="h-8 w-8 text-emerald-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Assemble Handover Packet</h1>
        <p className="text-slate-500 mt-2 max-w-xl mx-auto">Create a comprehensive, unified summary of your records to share with a new doctor.</p>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-xl font-bold text-slate-800">1. Select Information to Include</h2>
            <div className="space-y-3">
              {[
                { id: 'conditions', label: 'Active Conditions', desc: 'Current diagnoses across all providers' },
                { id: 'medications', label: 'Reconciled Medications', desc: 'Unified list of active prescriptions and OTCs' },
                { id: 'allergies', label: 'Allergies & Intolerances', desc: 'Critical safety information' },
                { id: 'labs', label: 'Recent Labs (Last 6 Months)', desc: 'Test results and biomarker trends' },
                { id: 'notes', label: 'Clinical Notes', desc: 'Discharge summaries and visit notes' }
              ].map(section => (
                <div 
                  key={section.id}
                  onClick={() => toggleSection(section.id as keyof typeof selectedSections)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition flex items-center justify-between ${selectedSections[section.id as keyof typeof selectedSections] ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-100 hover:border-emerald-200'}`}
                >
                  <div>
                    <h4 className="font-semibold text-slate-800">{section.label}</h4>
                    <p className="text-sm text-slate-500 mt-0.5">{section.desc}</p>
                  </div>
                  <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${selectedSections[section.id as keyof typeof selectedSections] ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300'}`}>
                    {selectedSections[section.id as keyof typeof selectedSections] && <CheckCircle2 className="h-4 w-4" />}
                  </div>
                </div>
              ))}
            </div>
            <button 
              onClick={() => setStep(2)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-lg transition flex items-center justify-center gap-2"
            >
              Continue <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 text-center">
            <div className="h-24 w-24 mx-auto relative">
               <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
               <div className="absolute inset-0 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin"></div>
               <div className="absolute inset-0 flex items-center justify-center">
                 <FileText className="h-8 w-8 text-emerald-600" />
               </div>
            </div>
            <h2 className="text-xl font-bold text-slate-800">Generating Packet...</h2>
            <p className="text-slate-500">Compiling and deduplicating your medical records.</p>
            {/* Simulate auto-advance in a real app */}
            <button 
              onClick={() => setStep(3)}
              className="mt-4 text-emerald-600 font-medium underline text-sm"
            >
              (Skip to done)
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 text-center">
            <div className="h-20 w-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Handover Packet Ready</h2>
            <p className="text-slate-500">Your unified medical summary has been generated and is ready to share.</p>
            
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 text-left my-8">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="h-6 w-6 text-slate-600" />
                <div>
                  <h4 className="font-bold text-slate-800">Complete_Handover_Summary.pdf</h4>
                  <p className="text-sm text-slate-500">Includes 3 sections • 2.4 MB</p>
                </div>
              </div>
              <div className="flex gap-2">
                <span className="px-2 py-1 bg-white border border-slate-200 text-xs font-medium text-slate-600 rounded">Encrypted</span>
                <span className="px-2 py-1 bg-white border border-slate-200 text-xs font-medium text-slate-600 rounded">HIPAA Compliant</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <button className="flex items-center justify-center gap-2 py-3 px-4 bg-white border-2 border-emerald-600 text-emerald-700 rounded-xl font-bold hover:bg-emerald-50 transition">
                 <FileDown className="h-5 w-5" /> Download PDF
               </button>
               <button className="flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition">
                 <Lock className="h-5 w-5" /> Generate Secure Link
               </button>
            </div>
            
            <button onClick={() => setStep(1)} className="text-sm text-slate-400 font-medium hover:text-slate-600 pt-4">Start Over</button>
          </div>
        )}
      </div>
    </div>
  );
}
