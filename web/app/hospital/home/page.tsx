"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchAPI } from "@/lib/api";
import { 
  Users, Activity, AlertTriangle, FileText, Search, UserPlus, 
  Calendar, CheckCircle2, Clock, AlertCircle, Beaker 
} from "lucide-react";

export default function DoctorHome() {
  const [data, setData] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    fetchAPI('/hospital/my-day').then(setData).catch(console.error);
  }, []);

  if (!data) return <div className="p-8 animate-pulse text-slate-500">Loading your workspace...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header & Quick Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Good morning, {data.doctor_name}</h1>
          <p className="text-slate-500 mt-1 flex items-center gap-2">
            <Calendar className="w-4 h-4" /> {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} 
            <span className="text-slate-300">|</span> 
            {data.clinic}
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => router.push('/hospital/search')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            <Search className="w-4 h-4" /> Search Patient
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
            <UserPlus className="w-4 h-4" /> New Patient
          </button>
          <button className="flex items-center gap-2 px-5 py-2 bg-emerald-600 rounded-xl text-sm font-medium text-white hover:bg-emerald-700 transition shadow-sm">
            Start Next Consult
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Patients Today", value: data.stats.patients_today, icon: Users, color: "text-emerald-600", bg: "bg-emerald-100" },
          { label: "Waiting Now", value: data.stats.waiting_now, icon: Clock, color: "text-amber-600", bg: "bg-amber-100" },
          { label: "Results to Review", value: data.stats.results_review, icon: FileText, color: "text-blue-600", bg: "bg-blue-100" },
          { label: "Open Alerts", value: data.stats.open_alerts, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-100" }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.bg} ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Schedule */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">Today's Schedule</h2>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
                <tr>
                  <th className="px-6 py-3 font-semibold">Time</th>
                  <th className="px-6 py-3 font-semibold">Patient</th>
                  <th className="px-6 py-3 font-semibold">Reason</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.schedule.map((apt: any, i: number) => (
                  <tr 
                    key={i} 
                    className="hover:bg-slate-50 cursor-pointer group"
                    onClick={() => router.push(`/hospital/patient/${apt.id}/consult`)}
                  >
                    <td className="px-6 py-4 font-medium text-slate-700 whitespace-nowrap">{apt.time}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{apt.patient_name}</div>
                      <div className="text-xs text-slate-500">{apt.age}y • {apt.sex === 'female' ? 'F' : 'M'}</div>
                      {apt.flags.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {apt.flags.includes('allergy') && <span className="text-[10px] uppercase font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Allergy</span>}
                          {apt.flags.includes('high-risk') && <span className="text-[10px] uppercase font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">High Risk</span>}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{apt.reason}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold
                        ${apt.status === 'Done' ? 'bg-slate-100 text-slate-600' : 
                          apt.status === 'In consult' ? 'bg-blue-100 text-blue-700' : 
                          apt.status === 'Waiting' ? 'bg-amber-100 text-amber-700' : 
                          'bg-emerald-100 text-emerald-700'}`}
                      >
                        {apt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-emerald-600 font-semibold text-sm opacity-0 group-hover:opacity-100 transition">
                        Start Consult &rarr;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Sidebar: Needs Attention & Activity */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" /> Needs Attention
            </h2>
            <div className="space-y-4">
              {data.needs_attention.map((item: any) => (
                <div key={item.id} className="p-4 rounded-xl border border-red-100 bg-red-50/50 cursor-pointer hover:bg-red-50 transition">
                  <h4 className="font-bold text-red-900 text-sm mb-1">{item.title}</h4>
                  <div className="flex justify-between items-center text-xs text-red-700">
                    <span>{item.patient}</span>
                    <span>{item.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-500" /> Activity Feed
            </h2>
            <div className="space-y-4">
              {data.activity_feed.map((item: any) => (
                <div key={item.id} className="text-sm">
                  <p className="text-slate-800"><span className="font-semibold">{item.patient}:</span> {item.text}</p>
                  <p className="text-xs text-slate-500 mt-1">{item.time}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
