'use client';

import { useState } from 'react';
import { Pill, Activity, Stethoscope, ChevronLeft, ChevronRight, Search, FileText } from 'lucide-react';

const mockTimelineData = [
  { id: 1, date: '2023-10-15', type: 'visit', title: 'Annual Physical', provider: 'Dr. Sharma', icon: Stethoscope, color: 'emerald' },
  { id: 2, date: '2023-11-02', type: 'lab', title: 'Comprehensive Metabolic Panel', provider: 'Dr. Lal PathLabs', icon: Activity, color: 'blue' },
  { id: 3, date: '2024-01-20', type: 'medication', title: 'Started Amlodipine', provider: '10mg daily', icon: Pill, color: 'rose' },
  { id: 4, date: '2024-02-14', type: 'visit', title: 'Cardiology Consult', provider: 'Dr. Smith', icon: Stethoscope, color: 'emerald' },
  { id: 5, date: '2024-03-01', type: 'document', title: 'Echocardiogram Results', provider: 'Kaveri Hospital Medical Center', icon: FileText, color: 'amber' },
];

const colorMap: Record<string, { bg: string, text: string, badgeBg: string, badgeText: string }> = {
  emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600', badgeBg: 'bg-emerald-50', badgeText: 'text-emerald-700' },
  blue: { bg: 'bg-blue-100', text: 'text-blue-600', badgeBg: 'bg-blue-50', badgeText: 'text-blue-700' },
  rose: { bg: 'bg-rose-100', text: 'text-rose-600', badgeBg: 'bg-rose-50', badgeText: 'text-rose-700' },
  amber: { bg: 'bg-amber-100', text: 'text-amber-600', badgeBg: 'bg-amber-50', badgeText: 'text-amber-700' },
};

export default function Timeline() {
  const [activeYear, setActiveYear] = useState('2024');

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Health Timeline</h1>
          <p className="text-slate-500 mt-1">Your medical history, organized.</p>
        </div>
        <div className="flex items-center gap-2">
           <div className="relative">
             <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
             <input type="text" placeholder="Filter timeline..." className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 w-full md:w-64" />
           </div>
        </div>
      </header>

      {/* Horizontal Scrollable Ruler */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-8">
          <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-500 transition"><ChevronLeft className="h-5 w-5" /></button>
          <div className="flex gap-4">
             {['2021', '2022', '2023', '2024'].map(year => (
               <button 
                key={year}
                onClick={() => setActiveYear(year)}
                className={`text-lg font-bold px-4 py-1 rounded-full transition ${activeYear === year ? 'bg-emerald-100 text-emerald-700' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 {year}
               </button>
             ))}
          </div>
          <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-500 transition"><ChevronRight className="h-5 w-5" /></button>
        </div>
        
        {/* The Ruler Line */}
        <div className="relative h-32 w-full overflow-x-auto hide-scrollbar">
          <div className="min-w-[800px] relative h-full flex items-center">
             {/* Base Line */}
             <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 -translate-y-1/2 rounded-full"></div>
             
             {/* Months Markers */}
             {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, i) => (
                <div key={month} className="flex-1 relative h-full flex justify-center">
                   <div className="absolute top-1/2 h-4 w-px bg-slate-200 -translate-y-1/2"></div>
                   <span className="absolute bottom-4 text-xs font-medium text-slate-400">{month}</span>
                   
                   {/* Event Markers (Mock logic based on month index for visual) */}
                   {i === 0 && <div className="absolute top-[20%] w-3 h-3 rounded-full bg-rose-500 border-2 border-white shadow-sm cursor-pointer hover:scale-125 transition"></div>}
                   {i === 1 && <div className="absolute top-[30%] w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm cursor-pointer hover:scale-125 transition"></div>}
                   {i === 2 && <div className="absolute top-[70%] w-3 h-3 rounded-full bg-amber-500 border-2 border-white shadow-sm cursor-pointer hover:scale-125 transition"></div>}
                   {i === 9 && <div className="absolute top-[40%] w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm cursor-pointer hover:scale-125 transition"></div>}
                   {i === 10 && <div className="absolute top-[60%] w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-sm cursor-pointer hover:scale-125 transition"></div>}
                </div>
             ))}
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-6">{activeYear} Events</h3>
        <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
           {mockTimelineData.map((event, i) => {
             const colors = colorMap[event.color] || colorMap.emerald;
             return (
             <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
               <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white ${colors.bg} ${colors.text} shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 absolute md:left-1/2 z-10`}>
                 <event.icon className="w-5 h-5" />
               </div>
               
               <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-slate-100 shadow-sm ml-14 md:ml-0 md:group-even:mr-auto md:group-odd:ml-auto hover:border-emerald-200 transition cursor-pointer z-10 relative">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-slate-800">{event.date}</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${colors.badgeBg} ${colors.badgeText} uppercase tracking-wider`}>{event.type}</span>
                  </div>
                  <h4 className="font-semibold text-slate-800 text-lg">{event.title}</h4>
                  <p className="text-slate-500 text-sm mt-1">{event.provider}</p>
               </div>
             </div>
           )})}
        </div>
      </div>
    </div>
  );
}
