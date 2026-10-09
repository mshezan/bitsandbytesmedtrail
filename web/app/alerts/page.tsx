'use client';

import { Bell, AlertCircle, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

const mockAlerts = [
  { id: 1, type: 'critical', title: 'Medication Refill Needed', desc: 'Lisinopril 10mg runs out in 3 days.', time: '2 hours ago', icon: AlertCircle },
  { id: 2, type: 'warning', title: 'Abnormal Lab Result', desc: 'Your recent LDL Cholesterol is slightly elevated (130 mg/dL).', time: 'Yesterday', icon: AlertTriangle },
  { id: 3, type: 'info', title: 'Upcoming Appointment', desc: 'Follow-up with Dr. Chen tomorrow at 10:00 AM.', time: '2 days ago', icon: Info },
];

export default function Alerts() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Smart Alerts</h1>
          <p className="text-slate-500 mt-1">Actionable insights and notifications.</p>
        </div>
        <button className="flex items-center space-x-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl transition font-medium">
          <CheckCircle2 className="h-4 w-4" />
          <span>Mark all as read</span>
        </button>
      </header>

      <div className="space-y-4">
        {mockAlerts.map(alert => (
          <div key={alert.id} className={`p-5 rounded-2xl border flex gap-4 ${alert.type === 'critical' ? 'bg-rose-50 border-rose-100' : alert.type === 'warning' ? 'bg-amber-50 border-amber-100' : 'bg-blue-50 border-blue-100'}`}>
            <div className={`p-2 h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${alert.type === 'critical' ? 'bg-rose-100 text-rose-600' : alert.type === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
              <alert.icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className={`font-semibold ${alert.type === 'critical' ? 'text-rose-900' : alert.type === 'warning' ? 'text-amber-900' : 'text-blue-900'}`}>{alert.title}</h3>
                <span className="text-xs font-medium opacity-60">{alert.time}</span>
              </div>
              <p className={`mt-1 text-sm ${alert.type === 'critical' ? 'text-rose-700' : alert.type === 'warning' ? 'text-amber-700' : 'text-blue-700'}`}>{alert.desc}</p>
              
              <div className="mt-4 flex gap-3">
                <button className={`text-sm font-medium px-4 py-2 rounded-lg ${alert.type === 'critical' ? 'bg-rose-600 text-white hover:bg-rose-700' : alert.type === 'warning' ? 'bg-amber-600 text-white hover:bg-amber-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                  Take Action
                </button>
                <button className={`text-sm font-medium px-4 py-2 rounded-lg hover:bg-white/50 transition ${alert.type === 'critical' ? 'text-rose-700' : alert.type === 'warning' ? 'text-amber-700' : 'text-blue-700'}`}>
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
