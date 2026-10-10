"use client";

import { useState, useEffect } from "react";
import { fetchAPI } from "@/lib/api";
import { 
  Network, Server, AlertCircle, CheckCircle2, Activity, Database, 
  Link as LinkIcon, RefreshCw, XCircle, Search, FileJson, ArrowRight
} from "lucide-react";
import RawVsUnifiedViewer from "@/components/RawVsUnifiedViewer";
import NetworkMap from "@/components/NetworkMap";

export default function IntegrationHub() {
  const [stats, setStats] = useState<any>(null);
  const [nodes, setNodes] = useState<any[]>([]);
  const [queue, setQueue] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("network");
  const [viewerOpen, setViewerOpen] = useState(false);

  useEffect(() => {
    fetchAPI("/hospital/integration/stats").then(setStats);
    fetchAPI("/hospital/integration/nodes").then(setNodes);
    fetchAPI("/hospital/integration/queue/identity").then(setQueue);
  }, []);

  if (!stats) return <div className="p-8">Loading Hub...</div>;

  return (
    <div className="flex-1 bg-slate-50 min-h-screen">
      <RawVsUnifiedViewer isOpen={viewerOpen} onClose={() => setViewerOpen(false)} />
      
      {/* Stats Strip */}
      <div className="bg-emerald-900 text-white p-6 shadow-md">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Network className="w-8 h-8 text-emerald-400" />
            <h1 className="text-2xl font-bold">Integration Hub & Pipeline</h1>
          </div>
          <div className="grid grid-cols-5 gap-4">
            <div className="bg-emerald-800/50 p-4 rounded-xl border border-emerald-700/50">
              <p className="text-emerald-200 text-xs font-bold uppercase mb-1">Organizations</p>
              <p className="text-3xl font-light">{stats.organizations_connected}</p>
            </div>
            <div className="bg-emerald-800/50 p-4 rounded-xl border border-emerald-700/50">
              <p className="text-emerald-200 text-xs font-bold uppercase mb-1">Records Unified</p>
              <p className="text-3xl font-light">{stats.records_unified}</p>
            </div>
            <div className="bg-emerald-800/50 p-4 rounded-xl border border-emerald-700/50">
              <p className="text-emerald-200 text-xs font-bold uppercase mb-1">Cross-Matched Pts</p>
              <p className="text-3xl font-light">{stats.patients_matched_multiple}</p>
            </div>
            <div className="bg-emerald-800/50 p-4 rounded-xl border border-emerald-700/50">
              <p className="text-emerald-200 text-xs font-bold uppercase mb-1">Duplicates Prevented</p>
              <p className="text-3xl font-light">{stats.duplicates_prevented}</p>
            </div>
            <div className="bg-emerald-800/50 p-4 rounded-xl border border-emerald-700/50">
              <p className="text-emerald-200 text-xs font-bold uppercase mb-1">Mapping Coverage</p>
              <p className="text-3xl font-light">{stats.mapping_coverage}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-end mb-4">
          <button onClick={() => setViewerOpen(true)} className="px-4 py-2 bg-emerald-100 text-emerald-800 text-sm font-bold rounded-lg border border-emerald-200 hover:bg-emerald-200 flex items-center gap-2 shadow-sm">
            <Search className="w-4 h-4" /> Open Pipeline Inspector Demo
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-slate-200 mb-6">
          {["network", "link_review", "mapping", "logs"].map(tab => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-2 text-sm font-semibold capitalize ${activeTab === tab ? 'border-b-2 border-emerald-600 text-emerald-700' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {tab.replace("_", " ")} {tab === 'link_review' && queue.length > 0 && <span className="ml-2 bg-rose-500 text-white py-0.5 px-2 rounded-full text-xs">{queue.length}</span>}
            </button>
          ))}
        </div>

        {activeTab === "network" && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-lg font-bold text-slate-800 mb-8">Live Network Map</h2>
            <NetworkMap nodes={nodes} />
          </div>
        )}

        {activeTab === "link_review" && (
          <div className="space-y-4">
            {queue.map(q => (
              <div key={q.id} className="bg-white rounded-2xl border border-rose-200 shadow-sm overflow-hidden">
                <div className="bg-rose-50 px-4 py-3 border-b border-rose-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-rose-800">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-bold">Identity Collision Detected</span>
                  </div>
                  <span className="text-xs font-bold bg-white text-rose-600 px-2 py-1 rounded-md border border-rose-200">
                    Score: {q.score.toFixed(2)} (Ambiguous)
                  </span>
                </div>
                
                <div className="p-6 grid grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase mb-4">Source Payload ({q.source.org})</h3>
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 text-sm"><span className="text-slate-500">Name</span><span className="col-span-2 font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">{q.source.name}</span></div>
                      <div className="grid grid-cols-3 text-sm"><span className="text-slate-500">DOB</span><span className="col-span-2 font-medium text-slate-800">{q.source.dob}</span></div>
                      <div className="grid grid-cols-3 text-sm"><span className="text-slate-500">Phone</span><span className="col-span-2 font-medium text-slate-800">{q.source.phone}</span></div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase mb-4">Existing MedTrail Record</h3>
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 text-sm"><span className="text-slate-500">Name</span><span className="col-span-2 font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{q.target.name}</span></div>
                      <div className="grid grid-cols-3 text-sm"><span className="text-slate-500">DOB</span><span className="col-span-2 font-medium text-slate-800">{q.target.dob}</span></div>
                      <div className="grid grid-cols-3 text-sm"><span className="text-slate-500">Phone</span><span className="col-span-2 font-medium text-slate-800">{q.target.phone}</span></div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 border-t border-slate-200 flex gap-3 justify-end">
                  <button className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">Create New Patient</button>
                  <button className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 flex items-center gap-2">
                    <LinkIcon className="w-4 h-4" /> Force Merge
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
