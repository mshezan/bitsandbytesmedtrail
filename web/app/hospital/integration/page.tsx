"use client";
import { formatDate, formatPhone } from "@/lib/formatters";

import { useState, useEffect } from "react";
import { fetchAPI } from "@/lib/api";
import { 
  Network, Server, AlertCircle, CheckCircle2, Activity, Database, 
  RefreshCw, XCircle, Search, FileJson, FileText, ArrowRight, ShieldAlert, Link as LinkIcon,
  ChevronDown, ChevronUp, Key, Calendar
} from "lucide-react";
import RawVsUnifiedViewer from "@/components/RawVsUnifiedViewer";
import NetworkMap from "@/components/NetworkMap";


export default function ConnectedHospitals() {
  const [stats, setStats] = useState<any>(null);
  const [nodes, setNodes] = useState<any[]>([]);
  const [queue, setQueue] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("network");
  const [viewerOpen, setViewerOpen] = useState(false);
  const [expandedNode, setExpandedNode] = useState<string | null>(null);
  const [overrideReason, setOverrideReason] = useState("");

  useEffect(() => {
    fetchAPI("/hospital/integration/stats").then(setStats).catch(console.error);
    fetchAPI("/hospital/integration/nodes").then(setNodes).catch(console.error);
    fetchAPI("/hospital/integration/queue/identity").then(setQueue).catch(console.error);
  }, []);

  if (!stats) return <div className="p-8 text-slate-500 animate-pulse font-medium text-center h-full flex items-center justify-center">Loading Connected Hospitals...</div>;

  const syncedCount = nodes.filter(n => n.last_sync.includes("mins") || n.last_sync.includes("now") || n.last_sync.includes("hour")).length;
  const attentionCount = nodes.filter(n => n.status === "attention").length;

  const compareField = (source: string, target: string, type: string) => {
    if (!source || source === "-") return "Different";
    if (source.toLowerCase() === target.toLowerCase()) return "Match";
    if (type === "dob" && source.substring(0, 4) === target.substring(0, 4)) return "Similar"; // Same year
    if (type === "name" && (source.includes(target.split(' ')[0]) || target.includes(source.split(' ')[0]))) return "Similar";
    return "Different";
  };

  const getChipStyle = (match: string) => {
    if (match === "Match") return "bg-emerald-100 text-emerald-800 border-emerald-200";
    if (match === "Similar") return "bg-amber-100 text-amber-800 border-amber-200";
    return "bg-rose-100 text-rose-800 border-rose-200";
  };

  
  
  return (
    <div className="flex-1 bg-slate-50 min-h-screen">
      <RawVsUnifiedViewer isOpen={viewerOpen} onClose={() => setViewerOpen(false)} />
      
      {/* Header Summary */}
      <div className="bg-white border-b border-slate-200 px-8 py-6 shadow-sm">
        <div className="flex items-center gap-3">
          <Network className="w-8 h-8 text-emerald-600" />
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Connected Hospitals</h1>
        </div>
        <p className="text-slate-600 mt-2 font-medium">
          <strong className="text-slate-800">{nodes.length}</strong> organizations connected, <strong className="text-emerald-700">{syncedCount}</strong> synced recently, and <strong className={attentionCount > 0 ? "text-rose-600" : "text-slate-500"}>{attentionCount}</strong> needs attention.
        </p>
      </div>

      <div className="max-w-[1400px] mx-auto p-6 lg:p-8">
        
        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-200 mb-8">
          {[
            { id: "network", label: "Network Map" },
            { id: "integrations", label: "Data Sources & API" },
            { id: "link_review", label: "Link Review" }
          ].map(tab => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-4 text-sm font-bold capitalize transition border-b-2 ${activeTab === tab.id ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'}`}
            >
              {tab.label} {tab.id === 'link_review' && queue.length > 0 && <span className="ml-2 bg-rose-500 text-white py-0.5 px-2 rounded-full text-[10px] shadow-sm">{queue.length}</span>}
            </button>
          ))}
        </div>

        {activeTab === "network" && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex justify-center w-full">
            <NetworkMap nodes={nodes} />
          </div>
        )}

        {activeTab === "integrations" && (
          <div className="space-y-4">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Configured Data Sources</h2>
                <p className="text-sm text-slate-500">Manage connections, view sync health, and configure technical access.</p>
              </div>
              <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-emerald-700 transition flex items-center gap-2">
                <Database className="w-4 h-4"/> Add Data Source
              </button>
            </div>
            
            {nodes.map(node => (
              <div key={node.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div 
                  className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition"
                  onClick={() => setExpandedNode(expandedNode === node.id ? null : node.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full shadow-sm ${node.status === 'online' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">{node.name} <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{node.city}</span></h3>
                      <p className="text-sm text-slate-500 flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1"><RefreshCw className="w-3.5 h-3.5"/> Last sync: {node.last_sync}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5"/> {node.records.toLocaleString()} records received</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{node.format}</span>
                    {expandedNode === node.id ? <ChevronUp className="w-5 h-5 text-slate-400"/> : <ChevronDown className="w-5 h-5 text-slate-400"/>}
                  </div>
                </div>

                {expandedNode === node.id && (
                  <div className="bg-slate-50 border-t border-slate-200 p-6 flex flex-col gap-6">
                    {node.error && (
                      <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg text-sm font-bold flex items-center gap-2">
                        <AlertCircle className="w-5 h-5"/> {node.error}
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-6">
                       <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                         <h4 className="text-sm font-bold text-slate-800 mb-2 uppercase tracking-wider flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-600"/> Sync Metrics</h4>
                         <div className="space-y-2 text-sm text-slate-600">
                           <div className="flex justify-between border-b border-slate-100 pb-2"><span>Connection Uptime</span><span className="font-bold text-slate-900">99.9%</span></div>
                           <div className="flex justify-between border-b border-slate-100 pb-2"><span>Records Mapped Successfully</span><span className="font-bold text-emerald-600">98.4%</span></div>
                           <div className="flex justify-between pb-1"><span>Identity Resolution Rate</span><span className="font-bold text-slate-900">95.2% Auto-linked</span></div>
                         </div>
                       </div>
                       
                       <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                         <h4 className="text-sm font-bold text-slate-800 mb-2 uppercase tracking-wider flex items-center gap-2"><Key className="w-4 h-4 text-indigo-600"/> Technical Access (Admin)</h4>
                         <div className="space-y-3">
                           <p className="text-xs text-slate-500">API keys used by this organization to push or pull MedTrail data.</p>
                           <div className="bg-slate-100 border border-slate-200 rounded p-2 flex justify-between items-center">
                              <code className="text-xs text-slate-600 font-mono">sk_live_...9f2a</code>
                              <button className="text-xs font-bold text-rose-600 hover:underline">Revoke</button>
                           </div>
                           <button className="text-xs font-bold text-indigo-600 hover:underline mt-2 inline-block">Generate New Key</button>
                         </div>
                       </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === "link_review" && (
          <div className="space-y-6">
            <div className="flex justify-between items-end mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Link Review Queue</h2>
                <p className="text-sm text-slate-500">Carefully review ambiguous identity matches before linking records.</p>
              </div>
              <div className="flex gap-4 text-sm font-bold bg-white p-2 rounded-xl shadow-sm border border-slate-200">
                <span className="text-slate-600">Auto-linked today: <span className="text-emerald-600">342</span></span>
                <span className="text-slate-600">Reviewed: <span className="text-indigo-600">18</span></span>
                <span className="text-slate-600">Rejected: <span className="text-rose-600">2</span></span>
              </div>
            </div>

            {queue.map(q => {
               const nameMatch = compareField(q.source.name, q.target.name, "name");
               const dobMatch = compareField(q.source.dob, q.target.dob, "dob");
               const phoneMatch = compareField(q.source.phone, q.target.phone, "phone");
               const blockLink = dobMatch === "Different" && phoneMatch === "Different";

               return (
                 <div key={q.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                   <div className="bg-amber-50 px-6 py-3 border-b border-amber-100 flex items-center justify-between">
                     <div className="flex items-center gap-2 text-amber-900">
                       <AlertCircle className="w-5 h-5" />
                       <span className="font-bold">Possible same patient</span>
                     </div>
                     <div className="flex items-center gap-4">
                       <span className="text-xs font-bold text-amber-700">Reason: {q.reason}</span>
                       <span className="text-xs font-black bg-white text-slate-700 px-2 py-1 rounded-md border border-slate-200 shadow-sm">
                         Match Score: {(q.score * 100).toFixed(0)}%
                       </span>
                     </div>
                   </div>

                   <div className="grid grid-cols-2 divide-x divide-slate-100 relative">
                     <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm z-10">
                       <LinkIcon className="w-4 h-4 text-slate-400" />
                     </div>
                     
                     <div className="p-6 bg-slate-50/50">
                       <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4">Incoming Record ({q.source.org})</h3>
                       <div className="space-y-4">
                         <div className="flex justify-between items-center"><span className="text-sm font-bold text-slate-500 w-16">Name</span> <span className="text-sm font-black text-slate-900">{q.source.name}</span></div>
                         <div className="flex justify-between items-center"><span className="text-sm font-bold text-slate-500 w-16">DOB</span> <span className="text-sm font-bold text-slate-800">{formatDate(q.source.dob)}</span></div>
                         <div className="flex justify-between items-center"><span className="text-sm font-bold text-slate-500 w-16">Phone</span> <span className="text-sm font-mono text-slate-700 bg-slate-100 px-1 rounded">{formatPhone(q.source.phone)}</span></div>
                         <div className="flex justify-between items-center"><span className="text-sm font-bold text-slate-500 w-16">Sex</span> <span className="text-sm font-bold text-slate-800">{q.source.sex}</span></div>
                         <div className="flex justify-between items-center"><span className="text-sm font-bold text-slate-500 w-16">ABHA ID</span> <span className="text-sm font-mono text-slate-700">{q.source.abha}</span></div>
                       </div>
                     </div>

                     <div className="p-6">
                       <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4 flex justify-between">
                         <span>Existing MedTrail Profile</span>
                         <span className="text-emerald-600">Target</span>
                       </h3>
                       <div className="space-y-4">
                         <div className="flex justify-between items-center">
                           <span className="text-sm font-black text-slate-900">{q.target.name}</span>
                           <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${getChipStyle(nameMatch)}`}>{nameMatch}</span>
                         </div>
                         <div className="flex justify-between items-center">
                           <span className="text-sm font-bold text-slate-800">{formatDate(q.target.dob)}</span>
                           <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${getChipStyle(dobMatch)}`}>{dobMatch}</span>
                         </div>
                         <div className="flex justify-between items-center">
                           <span className="text-sm font-mono text-slate-700 bg-slate-50 px-1 rounded border border-slate-100">{formatPhone(q.target.phone)}</span>
                           <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${getChipStyle(phoneMatch)}`}>{phoneMatch}</span>
                         </div>
                         <div className="flex justify-between items-center">
                           <span className="text-sm font-bold text-slate-800">{q.target.sex}</span>
                           <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${getChipStyle("Match")}`}>Match</span>
                         </div>
                         <div className="flex justify-between items-center">
                           <span className="text-sm font-mono text-slate-700">{q.target.abha}</span>
                           <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${getChipStyle(q.target.abha === "-" ? "Different" : "Match")}`}>{q.target.abha === "-" ? "Missing" : "Match"}</span>
                         </div>
                       </div>
                     </div>
                   </div>

                   <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col items-end gap-3">
                     {blockLink && (
                       <div className="w-full bg-rose-50 border border-rose-200 p-3 rounded-lg flex flex-col gap-2">
                         <span className="text-xs font-bold text-rose-800 flex items-center gap-1"><ShieldAlert className="w-4 h-4"/> Blocked: Both DOB and Phone differ significantly.</span>
                         <input type="text" placeholder="Admin Override Reason..." value={overrideReason} onChange={e => setOverrideReason(e.target.value)} className="w-full px-3 py-1.5 text-sm rounded border border-rose-300 outline-none focus:border-rose-500" />
                       </div>
                     )}
                     
                     <div className="flex gap-3">
                       <button className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-100 transition">Decide Later</button>
                       <button className="px-4 py-2 bg-rose-100 border border-rose-200 rounded-lg text-sm font-bold text-rose-700 hover:bg-rose-200 transition">Different Patients</button>
                       <button 
                         disabled={blockLink && !overrideReason}
                         className="px-6 py-2 bg-indigo-600 border border-indigo-700 rounded-lg text-sm font-bold text-white shadow-sm hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-2"
                       >
                         <CheckCircle2 className="w-4 h-4"/> Same patient: link records
                       </button>
                     </div>
                   </div>
                 </div>
               );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
