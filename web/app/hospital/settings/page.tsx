"use client";

import { useState, useEffect } from "react";
import { Key, Activity, CheckCircle2, AlertCircle } from "lucide-react";

export default function IntegrationsAdmin() {
  const [activeTab, setActiveTab] = useState("api-keys");
  const [syncs, setSyncs] = useState<any[]>([]);
  
  useEffect(() => {
    // In a real app we'd fetch from /api/v1/sources/status or an admin endpoint
    setSyncs([
      { id: "1", status: "completed", records_added: 124, errors: 0, started_at: new Date(Date.now() - 3600000).toISOString() },
      { id: "2", status: "completed", records_added: 15, errors: 2, started_at: new Date(Date.now() - 86400000).toISOString() },
      { id: "3", status: "failed", records_added: 0, errors: 10, started_at: new Date(Date.now() - 172800000).toISOString() }
    ]);
  }, []);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-800 mb-4">Integrations & API</h1>
        <div className="flex gap-6 text-sm font-medium">
          <button 
            className={`pb-3 ${activeTab === 'api-keys' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500'}`}
            onClick={() => setActiveTab('api-keys')}
          >
            API Keys
          </button>
          <button 
            className={`pb-3 ${activeTab === 'sync-history' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500'}`}
            onClick={() => setActiveTab('sync-history')}
          >
            Sync History
          </button>
        </div>
      </div>

      {activeTab === 'api-keys' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-700">Active API Keys</h2>
              <p className="text-sm text-slate-500">Manage keys for system-to-system FHIR integrations.</p>
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
              Generate New Key
            </button>
          </div>
          
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-slate-500 border-b border-slate-100">
                <th className="pb-3 font-medium">Label</th>
                <th className="pb-3 font-medium">Key Prefix</th>
                <th className="pb-3 font-medium">Created</th>
                <th className="pb-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-50">
                <td className="py-4 font-medium flex items-center gap-2"><Key className="w-4 h-4 text-slate-400" /> Primary HIS Sync</td>
                <td className="py-4 font-mono text-slate-500">test-key-***</td>
                <td className="py-4 text-slate-500">Oct 1, 2026</td>
                <td className="py-4 text-right">
                  <button className="text-red-600 hover:text-red-700 font-medium">Revoke</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'sync-history' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-700">Recent Sync Operations</h2>
            <div className="text-sm text-slate-500 flex items-center gap-2">
              <Activity className="w-4 h-4" /> System Health: 98%
            </div>
          </div>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-slate-500 border-b border-slate-100">
                <th className="px-6 py-3 font-medium">Date & Time</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Records Added</th>
                <th className="px-6 py-3 font-medium">Errors / Warnings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {syncs.map((sync) => (
                <tr key={sync.id}>
                  <td className="px-6 py-4 text-slate-600">{new Date(sync.started_at).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    {sync.status === 'completed' ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-1 rounded text-xs font-medium">
                        <CheckCircle2 className="w-3 h-3" /> Completed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 px-2 py-1 rounded text-xs font-medium">
                        <AlertCircle className="w-3 h-3" /> Failed
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium">{sync.records_added}</td>
                  <td className="px-6 py-4 text-slate-500">{sync.errors > 0 ? <span className="text-amber-600 font-medium">{sync.errors} warnings</span> : '0'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
