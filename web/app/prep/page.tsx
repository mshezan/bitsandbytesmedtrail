'use client';

import { useState } from 'react';
import { Stethoscope, Clock, FileText, CheckCircle2, Plus, Trash2, Printer } from 'lucide-react';

export default function VisitPrep() {
  const [questions, setLal PathLabsions] = useState([
    { id: 1, text: 'Are there alternatives to Amlodipine with fewer side effects?', done: false },
    { id: 2, text: 'What should my target blood pressure be?', done: false },
  ]);
  const [newQ, setNewQ] = useState('');

  const addLal PathLabsion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQ.trim()) return;
    setLal PathLabsions([...questions, { id: Date.now(), text: newQ, done: false }]);
    setNewQ('');
  };

  const toggleQ = (id: number) => {
    setLal PathLabsions(questions.map(q => q.id === id ? { ...q, done: !q.done } : q));
  };

  const deleteQ = (id: number) => {
    setLal PathLabsions(questions.filter(q => q.id !== id));
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Visit Prep</h1>
          <p className="text-slate-500 mt-1">Get ready for your upcoming appointment.</p>
        </div>
        <button className="flex items-center space-x-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl transition font-medium">
          <Printer className="h-4 w-4" />
          <span>Print Summary</span>
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          {/* Appointment Info */}
          <div className="bg-emerald-600 rounded-2xl p-6 text-white shadow-sm">
            <div className="bg-emerald-500/50 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <Stethoscope className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold mb-1">Dr. Michael Chen</h2>
            <p className="text-emerald-100 font-medium">Cardiology Follow-up</p>
            
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-emerald-200" />
                <span className="font-medium">Tomorrow, 10:00 AM</span>
              </div>
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-emerald-200" />
                <span className="font-medium">Kaveri Hospital Medical Center</span>
              </div>
            </div>
          </div>

          {/* Quick Summary */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Since Last Visit</h3>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex gap-2"><span className="text-emerald-500 font-bold">•</span> Blood pressure avg: 120/80 (Improved)</li>
              <li className="flex gap-2"><span className="text-rose-500 font-bold">•</span> Reported mild dizziness 2x</li>
              <li className="flex gap-2"><span className="text-slate-400 font-bold">•</span> No missed medications</li>
            </ul>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          {/* Lal PathLabsions for Doctor */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-800">Lal PathLabsions for Doctor</h2>
              <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded-md">{questions.length} Total</span>
            </div>

            <form onSubmit={addLal PathLabsion} className="mb-6 flex gap-2">
              <input 
                type="text" 
                value={newQ}
                onChange={e => setNewQ(e.target.value)}
                placeholder="Ask about a symptom, medication, or test..." 
                className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
              <button type="submit" className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl font-medium hover:bg-emerald-200 transition">
                Add
              </button>
            </form>

            <div className="space-y-3">
              {questions.map(q => (
                <div key={q.id} className={`flex items-start gap-3 p-4 rounded-xl border transition ${q.done ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-200'}`}>
                  <button onClick={() => toggleQ(q.id)} className={`mt-0.5 shrink-0 ${q.done ? 'text-emerald-500' : 'text-slate-300 hover:text-emerald-500'}`}>
                    <CheckCircle2 className="h-6 w-6" />
                  </button>
                  <span className={`flex-1 font-medium ${q.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{q.text}</span>
                  <button onClick={() => deleteQ(q.id)} className="text-slate-400 hover:text-rose-500 transition p-1">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {questions.length === 0 && (
                <p className="text-center text-slate-500 py-4">No questions added yet.</p>
              )}
            </div>
          </div>

          {/* Current Vitals & Meds Snapshot */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Current Snapshot</h2>
            <div className="grid grid-cols-2 gap-4">
               <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Active Meds</h4>
                  <p className="font-bold text-slate-800 text-lg">3 Prescriptions</p>
               </div>
               <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Latest BP</h4>
                  <p className="font-bold text-slate-800 text-lg">120/80</p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
