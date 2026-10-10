with open("web/app/hospital/inbox/page.tsx", "r") as f:
    content = f.read()

import re

# Add sidebar button
nav_addition = """
          <button 
            onClick={() => setActiveTab('corrections')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition ${activeTab === 'corrections' ? 'bg-white shadow-sm border border-slate-200 text-slate-900' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <span className="flex items-center gap-2"><AlertTriangle className="w-4 h-4"/> Corrections</span>
            {data.corrections?.filter((c:any) => c.status === 'pending').length > 0 && (
              <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs">{data.corrections.filter((c:any) => c.status === 'pending').length}</span>
            )}
          </button>
"""
content = content.replace("</button>\n        </div>", "</button>\n" + nav_addition + "        </div>")

# Add Corrections Tab Body
corrections_ui = """
          {activeTab === 'corrections' && (
            <div className="max-w-5xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">Patient Correction Requests</h2>
                <p className="text-sm text-slate-500">Identity corrections require admin approval.</p>
              </div>

              <div className="space-y-4">
                {data.corrections?.map((c:any) => (
                  <div key={c.id} className="p-6 rounded-2xl border border-amber-200 bg-amber-50/30 shadow-sm flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="bg-amber-100 text-amber-800 text-[10px] uppercase font-bold px-2 py-1 rounded">Pending Review</span>
                        <h3 className="font-bold text-slate-900 mt-2">{c.patient_name}</h3>
                        <p className="text-sm text-slate-500">Submitted: {c.date}</p>
                      </div>
                      <button className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">Open Chart</button>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] grid grid-cols-2 gap-6">
                      <div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Disputed Record / Field</div>
                        <div className="text-sm font-medium text-slate-800">{c.disputed_field}</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Patient's Comment</div>
                        <div className="text-sm text-slate-700 italic">"{c.patient_comment}"</div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition">Accept & Amend</button>
                      <button className="px-5 py-2 bg-white border border-rose-200 text-rose-600 rounded-xl font-bold text-sm hover:bg-rose-50 transition">Reject (Requires Reason)</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
"""
content = content.replace("</div>\n      </div>", "</div>\n" + corrections_ui + "\n      </div>")

with open("web/app/hospital/inbox/page.tsx", "w") as f:
    f.write(content)
