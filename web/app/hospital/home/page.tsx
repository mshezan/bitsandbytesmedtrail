"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchAPI } from "@/lib/api";
import { 
  Users, Activity, AlertTriangle, FileText, Search, UserPlus, 
  Calendar, Clock, AlertCircle, Play, Pin, Link2, ShieldAlert, ArrowUpRight
} from "lucide-react";

export default function DoctorHome() {
  const [data, setData] = useState<any>(null);
  const [scheduleView, setScheduleView] = useState("today");
  const [loadError, setLoadError] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchAPI('/hospital/my-day').then(setData).catch((error: any) => setLoadError(error.message || "Could not load your day."));
  }, []);

  if (loadError) return <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800">{loadError}</div>;
  if (!data) return <div className="p-8 flex items-center justify-center h-full text-slate-500 font-medium">Loading clinical workspace...</div>;

  const today = new Date();
  const visibleSchedule = data.schedule.filter((appointment: any) => {
    if (!appointment.date) return false;
    const appointmentDate = new Date(`${appointment.date}T00:00:00`);
    const dayOffset = Math.round((appointmentDate.getTime() - new Date(today.toDateString()).getTime()) / 86400000);
    return scheduleView === "today" ? dayOffset === 0 : scheduleView === "tomorrow" ? dayOffset === 1 : dayOffset >= 0 && dayOffset < 7;
  });
  const doctorFirstName = (data.doctor_name || '').replace(/^Dr\.?\s*/i, '').trim().split(/\s+/)[0] || 'Doctor';

  return (
    <div className="min-h-full space-y-6">
      {/* Network Value Banner */}
      <div className="bg-emerald-900 text-white p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between shadow-md border border-emerald-950">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-800 rounded-full flex items-center justify-center border border-emerald-700/50 shadow-inner">
            <Activity className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">MedTrail Clinical Network</h2>
            <p className="text-emerald-200 text-sm mt-0.5">Continuously syncing patient records from regional hospitals and labs.</p>
          </div>
        </div>
        <div className="flex gap-6 mt-4 md:mt-0 px-2 divide-x divide-emerald-800">
          <div className="text-center px-4">
            <div className="text-2xl font-black text-white">{data.stats.network_records_week}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mt-1">Outside Records<br/>This Week</div>
          </div>
          <div className="text-center px-4">
            <div className="text-2xl font-black text-amber-400">{data.stats.network_alerts}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mt-1">Interaction Alerts<br/>Caught Early</div>
          </div>
          <div className="text-center px-4">
            <div className="text-2xl font-black text-emerald-300">{data.stats.repeat_tests_avoided}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mt-1">Repeat Tests<br/>Avoided</div>
          </div>
        </div>
      </div>

      {/* Header & Quick Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mt-2">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Good morning, Dr. {doctorFirstName}</h1>
          <p className="text-slate-500 mt-1.5 flex items-center gap-2 font-medium">
            <Calendar className="w-4 h-4 text-slate-400" /> {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} 
            <span className="text-slate-300">|</span> 
            {data.clinic}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => router.push('/hospital/search')} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition shadow-sm">
            <Search className="w-4 h-4 text-slate-500" /> Search Patient
          </button>
            <button onClick={() => router.push('/hospital/search')} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition shadow-sm">
              <UserPlus className="w-4 h-4 text-slate-500" /> New Patient
            </button>
          <button onClick={() => router.push(visibleSchedule[0] ? `/hospital/patient/${visibleSchedule[0].id}` : '/hospital/search')} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-700 rounded-xl text-sm font-bold text-white hover:bg-emerald-800 transition shadow-md shadow-emerald-200 ring-1 ring-emerald-700">
            <Play className="w-4 h-4" /> Start Next Consult
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Patients Today", value: data.stats.patients_today, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100" },
          { label: "Waiting Now", value: data.stats.waiting_now, icon: Clock, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
          { label: "Results to Review", value: data.stats.results_review, icon: FileText, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
          { label: "Open Alerts", value: data.stats.open_alerts, icon: ShieldAlert, ArrowUpRight, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100" }
        ].map((stat, i) => (
          <div key={i} className={`bg-white p-5 rounded-2xl border ${stat.border} shadow-sm flex items-center gap-4`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{stat.value}</p>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-0.5">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Schedule */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Schedule Controls */}
          <div className="flex justify-between items-end">
             <div className="flex bg-slate-200/50 p-1 rounded-xl">
               <button onClick={() => setScheduleView('today')} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition ${scheduleView === 'today' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Today</button>
               <button onClick={() => setScheduleView('tomorrow')} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition ${scheduleView === 'tomorrow' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Tomorrow</button>
               <button onClick={() => setScheduleView('week')} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition ${scheduleView === 'week' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>This Week</button>
             </div>
             
             <button onClick={() => router.push('/hospital/search')} className="text-xs font-bold text-emerald-700 flex items-center gap-1 hover:text-emerald-800 transition"><Clock className="w-3.5 h-3.5"/> Recent patients</button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-[10px]">Time</th>
                  <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-[10px]">Patient</th>
                  <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-[10px]">Reason</th>
                  <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-[10px]">Status</th>
                  <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-[10px] text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleSchedule.length ? visibleSchedule.map((apt: any, i: number) => (
                  <tr 
                    key={i} 
                    className="hover:bg-slate-50 cursor-pointer group transition"
                    onClick={() => router.push(`/hospital/patient/${apt.id}`)}
                  >
                    <td className="px-5 py-4 font-bold text-slate-700 whitespace-nowrap">{apt.time}</td>
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 text-base">{apt.patient_name}</div>
                      <div className="text-xs text-slate-500 font-medium mt-0.5">{apt.age}y • {apt.sex === 'female' ? 'F' : (apt.sex === 'male' ? 'M' : apt.sex)}</div>
                      {apt.flags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {apt.flags.includes('allergy') && <span className="text-[10px] uppercase font-black bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded border border-rose-200">Allergy</span>}
                          {apt.flags.includes('high risk') && <span className="text-[10px] uppercase font-black bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">High Risk</span>}
                          {apt.flags.includes('outside records') && <span className="text-[10px] uppercase font-black bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200 flex items-center gap-0.5"><Link2 className="w-3 h-3"/> Outside Records</span>}
                          {apt.flags.includes('new patient') && <span className="text-[10px] uppercase font-black bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-200">New Patient</span>}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-700 font-medium">{apt.reason}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold border
                        ${apt.status === 'Done' ? 'bg-slate-100 text-slate-600 border-slate-200' : 
                          apt.status === 'In consult' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 
                          apt.status === 'Waiting' ? 'bg-amber-100 text-amber-700 border-amber-200' : 
                          'bg-emerald-100 text-emerald-700 border-emerald-200'}`}
                      >
                        {apt.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button onClick={(event) => { event.stopPropagation(); router.push(`/hospital/patient/${apt.id}/consult`); }} className="text-indigo-600 font-bold text-sm opacity-0 group-hover:opacity-100 transition flex items-center justify-end w-full gap-1">
                        Start Consult <ArrowUpRight className="w-4 h-4"/>
                      </button>
                    </td>
                  </tr>
                )) : <tr><td colSpan={5} className="px-5 py-12 text-center"><p className="font-semibold text-slate-700">No appointments for this view</p><p className="mt-1 text-sm text-slate-500">Your recent patients are listed beside the schedule.</p></td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Sidebar: Needs Attention & Activity */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500" /> Needs Attention
              </h2>
              <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2 py-0.5 rounded-full">{data.needs_attention.length}</span>
            </div>
            <div className="p-2 space-y-1">
              {data.needs_attention.map((item: any) => (
                <div key={item.id} className={`p-3 rounded-xl border cursor-pointer transition ${item.urgent ? 'border-rose-200 bg-rose-50/50 hover:bg-rose-50' : 'border-transparent hover:bg-slate-50'}`}>
                  <h4 className={`font-bold text-sm mb-1 ${item.urgent ? 'text-rose-900' : 'text-slate-800'}`}>{item.title}</h4>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-slate-600">{item.patient}</span>
                    <span className="text-slate-400">{item.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between"><h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Recent patients</h2><button onClick={() => router.push('/hospital/search')} className="text-xs font-semibold text-emerald-700 hover:underline">Search all</button></div>
            <div className="divide-y divide-slate-100">{data.recent_patients.length ? data.recent_patients.slice(0, 6).map((patient: any) => <button key={patient.id} onClick={() => router.push(`/hospital/patient/${patient.id}`)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-emerald-50"><span className="min-w-0"><span className="block truncate text-sm font-semibold text-slate-800">{patient.name}</span><span className="block truncate text-xs text-slate-500">{patient.phone || patient.city || "Patient record"}</span></span><ArrowUpRight className="h-4 w-4 shrink-0 text-slate-400" /></button>) : <p className="p-4 text-sm text-slate-500">Patients you recently viewed will appear here.</p>}</div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" /> Network Activity
              </h2>
            </div>
            <div className="p-4 space-y-5">
              {data.activity_feed.map((item: any) => (
                <div key={item.id} className="text-sm flex gap-3 relative before:absolute before:left-3.5 before:top-6 before:bottom-[-20px] before:w-px before:bg-slate-200 last:before:hidden">
                  <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 z-10">
                     <Link2 className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-slate-800"><span className="font-bold">{item.patient}:</span> {item.text}</p>
                    <div className="flex items-center gap-2 mt-1">
                       <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">{item.org}</span>
                       <span className="text-xs font-medium text-slate-400">{item.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
