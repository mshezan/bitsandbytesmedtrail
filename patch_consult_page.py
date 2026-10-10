with open("web/app/hospital/patient/[id]/consult/page.tsx", "r") as f:
    content = f.read()

import re

# Add brief state
content = content.replace("const [data, setData] = useState<any>(null);", "const [data, setData] = useState<any>(null);\n  const [brief, setBrief] = useState<any>(null);\n  const [briefLoading, setBriefLoading] = useState(false);")

# Add brief fetch effect
brief_effect = """
  const fetchBrief = (force = false) => {
    setBriefLoading(true);
    fetchAPI(`/hospital/patient/${params.id}/brief${force ? '?force_regenerate=true' : ''}`)
      .then(setBrief)
      .catch(console.error)
      .finally(() => setBriefLoading(false));
  };
  useEffect(() => {
    if (activeTab === 'Brief' && !brief) fetchBrief();
  }, [activeTab, params.id, brief]);
"""
content = content.replace("fetchAPI(`/hospital/patient/${params.id}/workspace`).then(setData).catch(console.error);\n  }, [params.id]);", "fetchAPI(`/hospital/patient/${params.id}/workspace`).then(setData).catch(console.error);\n  }, [params.id]);\n" + brief_effect)

# Replace Brief UI
new_brief_ui = """
            {activeTab === "Brief" && (
              <div className="max-w-4xl space-y-6 pb-20">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100 flex items-start justify-between">
                  <div className="flex gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg text-blue-700 h-fit"><Activity className="w-5 h-5"/></div>
                    <div>
                      <h3 className="font-bold text-blue-900 text-sm">AI-Generated Pre-Visit Brief</h3>
                      <p className="text-xs text-blue-700 mt-1">Summary synthesized from unified patient records. Verify before acting. Decision support, not a diagnosis.</p>
                    </div>
                  </div>
                  <button onClick={() => fetchBrief(true)} disabled={briefLoading} className="text-xs font-bold text-blue-700 bg-white px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-100 transition disabled:opacity-50">
                    {briefLoading ? 'Generating...' : 'Regenerate'}
                  </button>
                </div>

                {briefLoading && !brief ? (
                  <div className="p-12 text-center text-slate-400 animate-pulse">Synthesizing clinical timeline...</div>
                ) : brief ? (
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">One-Line Summary</h4>
                      <p className="text-lg font-medium text-slate-800">{brief.summary}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Changes Since Last Visit</h4>
                        <ul className="space-y-2">
                          {brief.changes_since_last.map((item: any, i: number) => (
                            <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                              <span className="text-emerald-500 mt-0.5">•</span> 
                              <span>{item.text} {item.citations?.map((c: string) => <button key={c} className="text-[10px] text-blue-600 bg-blue-50 px-1 py-0.5 ml-1 rounded hover:underline">[{c.slice(0,4)}]</button>)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Open Issues</h4>
                        <ul className="space-y-2">
                          {brief.open_issues.map((item: any, i: number) => (
                            <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                              <span className="text-amber-500 mt-0.5">•</span> 
                              <span>{item.text} {item.citations?.map((c: string) => <button key={c} className="text-[10px] text-blue-600 bg-blue-50 px-1 py-0.5 ml-1 rounded hover:underline">[{c.slice(0,4)}]</button>)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-6">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Suggested Review Items</h4>
                      <ul className="space-y-2">
                        {brief.suggestions.map((item: any, i: number) => (
                          <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                            <span className="text-blue-500 mt-0.5"><CheckCircle2 className="w-4 h-4"/></span> 
                            <span>{item.text} {item.citations?.map((c: string) => <button key={c} className="text-[10px] text-blue-600 bg-blue-50 px-1 py-0.5 ml-1 rounded hover:underline">[{c.slice(0,4)}]</button>)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="border-t border-slate-100 pt-6 bg-slate-50 -mx-6 -mb-6 p-6 rounded-b-2xl">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Questions to Consider</h4>
                      <ul className="list-decimal pl-4 space-y-1">
                        {brief.questions.map((q: string, i: number) => (
                          <li key={i} className="text-sm text-slate-700 font-medium italic">{q}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
"""

content = re.sub(r'\{activeTab === "Brief".*?(?=\{activeTab === "Medications")', new_brief_ui, content, flags=re.DOTALL)

with open("web/app/hospital/patient/[id]/consult/page.tsx", "w") as f:
    f.write(content)
