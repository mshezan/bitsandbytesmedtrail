'use client';

import { FlaskConical, Download, Search, Filter, AlertCircle, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';

const mockLabs = [
  { 
    id: 'cholesterol', 
    name: 'Total Cholesterol', 
    unit: 'mg/dL',
    trend: 'up',
    abnormal: true,
    results: [
      { date: '2024-03-01', value: 245, provider: 'Quest Diagnostics', isAbnormal: true },
      { date: '2023-09-15', value: 230, provider: 'UCSF Lab', isAbnormal: true },
      { date: '2022-10-10', value: 195, provider: 'City Clinic', isAbnormal: false },
    ]
  },
  { 
    id: 'hba1c', 
    name: 'Hemoglobin A1c', 
    unit: '%',
    trend: 'down',
    abnormal: false,
    results: [
      { date: '2024-03-01', value: 5.4, provider: 'Quest Diagnostics', isAbnormal: false },
      { date: '2023-09-15', value: 5.8, provider: 'UCSF Lab', isAbnormal: false },
      { date: '2022-10-10', value: 6.2, provider: 'City Clinic', isAbnormal: true },
    ]
  },
  { 
    id: 'tsh', 
    name: 'TSH', 
    unit: 'mIU/L',
    trend: 'flat',
    abnormal: false,
    results: [
      { date: '2024-03-01', value: 2.1, provider: 'Quest Diagnostics', isAbnormal: false },
      { date: '2023-09-15', value: 2.3, provider: 'UCSF Lab', isAbnormal: false },
    ]
  }
];

export default function Labs() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Lab Results</h1>
          <p className="text-slate-500 mt-1">Cross-provider trends and biomarker history.</p>
        </div>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search tests or panels..." 
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 font-medium text-sm hover:bg-slate-50 transition w-full md:w-auto">
            <Filter className="h-4 w-4" />
            Filter
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {mockLabs.map(testGroup => (
            <div key={testGroup.id} className="p-4 md:p-6 hover:bg-slate-50 transition">
              <div className="flex flex-col md:flex-row gap-6">
                
                {/* Test Info */}
                <div className="md:w-1/3">
                  <div className="flex items-start gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${testGroup.abnormal ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                      <FlaskConical className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-800">{testGroup.name}</h3>
                        {testGroup.abnormal && (
                          <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" /> Abnormal
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 mt-1">Latest: <span className={`font-semibold ${testGroup.results[0].isAbnormal ? 'text-rose-600' : 'text-slate-700'}`}>{testGroup.results[0].value} {testGroup.unit}</span></p>
                    </div>
                  </div>
                </div>

                {/* Timeline / Trends */}
                <div className="md:w-2/3 flex items-center gap-4 overflow-x-auto pb-2">
                  {testGroup.results.map((res, i) => (
                    <div key={i} className="flex items-center gap-4 shrink-0">
                      <div className={`p-3 rounded-xl border min-w-[140px] ${res.isAbnormal ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-200'}`}>
                        <div className="text-xs text-slate-500 mb-1">{res.date}</div>
                        <div className="flex items-baseline gap-1">
                           <div className={`text-xl font-bold ${res.isAbnormal ? 'text-rose-700' : 'text-slate-800'}`}>{res.value}</div>
                           <div className="text-[10px] text-slate-400">{testGroup.unit}</div>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-2 truncate max-w-[120px]">{res.provider}</div>
                      </div>
                      {i < testGroup.results.length - 1 && (
                         <ArrowRight className="h-4 w-4 text-slate-300" />
                      )}
                    </div>
                  ))}
                </div>

              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
