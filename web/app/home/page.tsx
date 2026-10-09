'use client';
import { 
  FileText, Link2, AlertTriangle, Share2, 
  ChevronRight, Activity, PlusCircle, Clock, ShieldAlert, CheckCircle2, History
} from 'lucide-react';


import { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';

export default function Home() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetchAPI('/overview').then(setData).catch(console.error);
  }, []);
  
  if (!data) return <div className="p-8 text-slate-500">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Continuity Banner */}
      <div className="bg-emerald-700 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl font-bold mb-2">Continuity of Care</h1>
          <p className="text-emerald-100 max-w-2xl text-sm leading-relaxed mb-4">
            Your medical records are fragmented across multiple providers. We unify them to ensure your next clinician has the complete picture, preventing duplicate tests and medication conflicts.
          </p>
          <button className="bg-white text-emerald-800 px-4 py-2 rounded-lg font-medium text-sm hover:bg-emerald-50 transition shadow-sm">
            Generate Handover Packet
          </button>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-1/4 translate-y-1/4">
          <Activity className="h-64 w-64" />
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Unified Records" value="142" icon={FileText} color="bg-blue-100 text-blue-600" />
        <StatCard title="Connected Sources" value="4" icon={Link2} color="bg-indigo-100 text-indigo-600" />
        <StatCard title="Reconciliation Needs" value="2" icon={AlertTriangle} color="bg-rose-100 text-rose-600" alert />
        <StatCard title="Active Shares" value="0" icon={Share2} color="bg-emerald-100 text-emerald-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent additions & History */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Needs Attention Stack */}
          <div className="bg-white rounded-2xl shadow-sm border border-rose-100 p-5 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
             <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-rose-500" />
              <h2 className="text-lg font-bold text-slate-800">Needs Attention</h2>
            </div>
            <div className="space-y-3">
               <div className="flex items-start justify-between p-3 rounded-xl border border-slate-100 bg-slate-50 cursor-pointer hover:bg-slate-100 transition">
                  <div>
                    <h4 className="font-semibold text-sm text-slate-800">Possible Medication Conflict</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Lisinopril from UCSF and Losartan from City Clinic.</p>
                  </div>
                  <button className="text-xs font-semibold text-emerald-600 px-3 py-1 bg-white border border-slate-200 rounded-md">Resolve</button>
               </div>
               <div className="flex items-start justify-between p-3 rounded-xl border border-slate-100 bg-slate-50 cursor-pointer hover:bg-slate-100 transition">
                  <div>
                    <h4 className="font-semibold text-sm text-slate-800">Missing Provider Record</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Discharge summary from Valley Hospital ER missing.</p>
                  </div>
                  <button className="text-xs font-semibold text-emerald-600 px-3 py-1 bg-white border border-slate-200 rounded-md">Request</button>
               </div>
            </div>
          </div>

          {/* Recent Additions Feed */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-800">Recent Additions</h2>
              <button className="text-emerald-600 text-sm font-medium hover:text-emerald-700">View timeline</button>
            </div>
            <div className="space-y-6">
              {[
                { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100', title: 'Lab results synced', desc: 'Complete Blood Count (CBC) from Quest Diagnostics', time: '2 hours ago' },
                { icon: PlusCircle, color: 'text-emerald-600', bg: 'bg-emerald-100', title: 'New medication added', desc: 'Amoxicillin prescribed by Dr. Chen', time: 'Yesterday' },
                { icon: History, color: 'text-slate-600', bg: 'bg-slate-100', title: 'Past visit record imported', desc: 'Orthopedics consult, 2023', time: 'Yesterday' }
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className={`p-2 h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${item.bg}`}>
                    <item.icon className={`h-5 w-5 ${item.color}`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-800">{item.title}</h4>
                    <p className="text-slate-500 text-sm mt-0.5">{item.desc}</p>
                  </div>
                  <div className="text-xs font-medium text-slate-400">{item.time}</div>
                </div>
              ))}
            </div>
          </div>
          
          {/* History at a glance */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <h2 className="text-lg font-bold text-slate-800 mb-4">History at a glance</h2>
            <div className="flex gap-4 overflow-x-auto pb-2">
               <div className="min-w-[150px] p-4 bg-slate-50 border border-slate-100 rounded-xl">
                 <div className="text-xs text-slate-500 mb-1">Conditions</div>
                 <div className="font-semibold text-slate-800">Hypertension</div>
                 <div className="font-semibold text-slate-800">Type 2 Diabetes</div>
               </div>
               <div className="min-w-[150px] p-4 bg-rose-50 border border-rose-100 rounded-xl">
                 <div className="text-xs text-rose-500 mb-1">Allergies</div>
                 <div className="font-semibold text-rose-700">Penicillin</div>
                 <div className="font-semibold text-rose-700">Latex</div>
               </div>
               <div className="min-w-[150px] p-4 bg-blue-50 border border-blue-100 rounded-xl">
                 <div className="text-xs text-blue-500 mb-1">Surgeries</div>
                 <div className="font-semibold text-blue-800">Appendectomy</div>
                 <div className="text-xs text-blue-600 mt-1">2018</div>
               </div>
            </div>
          </div>

        </div>

        {/* Right Column: Sources & Quick Actions */}
        <div className="space-y-6">
          {/* Sources Panel */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800">Sources</h2>
              <button className="text-slate-400 hover:text-emerald-600"><PlusCircle className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">UCSF</div>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm text-slate-700">UCSF Health</span>
                    <span className="text-[10px] text-slate-400">Synced 2h ago</span>
                  </div>
                </div>
                <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs">CVS</div>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm text-slate-700">CVS Pharmacy</span>
                    <span className="text-[10px] text-slate-400">Synced 1d ago</span>
                  </div>
                </div>
                <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded bg-teal-100 flex items-center justify-center text-teal-600 font-bold text-xs">QD</div>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm text-slate-700">Quest Diagnostics</span>
                    <span className="text-[10px] text-slate-400">Synced 5d ago</span>
                  </div>
                </div>
                <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </div>
              <button className="w-full py-2 mt-2 flex items-center justify-center text-sm font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition border border-emerald-100">
                <Link2 className="h-4 w-4 mr-2" />
                Connect New Source
              </button>
            </div>
          </div>
          
          <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-5">
             <div className="flex gap-3">
               <ShieldAlert className="h-5 w-5 text-emerald-600 shrink-0" />
               <div>
                  <h3 className="font-semibold text-emerald-800 text-sm">Emergency Card Ready</h3>
                  <p className="text-xs text-emerald-700 mt-1 mb-3">Your vital information is configured for emergency access.</p>
                  <button className="text-xs font-bold bg-emerald-600 text-white px-3 py-1.5 rounded-md hover:bg-emerald-700">View Card</button>
               </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, alert }: { title: string, value: string, icon: any, color: string, alert?: boolean }) {
  return (
    <div className={`bg-white rounded-2xl p-5 shadow-sm border ${alert ? 'border-rose-200' : 'border-slate-100'}`}>
      <div className="flex items-start justify-between">
        <div className={`p-2.5 rounded-xl ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4">
        <div className="flex items-baseline space-x-1">
          <h3 className="text-3xl font-black text-slate-800 tracking-tight">{value}</h3>
        </div>
        <p className="text-sm font-medium text-slate-500 mt-1">{title}</p>
      </div>
    </div>
  )
}
