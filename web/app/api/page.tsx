"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Play, Terminal } from "lucide-react";

export default function APIPage() {
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runDemo = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/demo/status`);
      const data = await res.json();
      setResponse(data);
    } catch (e) {
      setResponse({ error: "Failed to connect to API" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center">
        <Link href="/" className="text-slate-500 hover:text-slate-800 flex items-center text-sm font-medium">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to MedTrail
        </Link>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row gap-12">
        <div className="flex-1">
          <h1 className="text-4xl font-bold mb-4">MedTrail Unified API</h1>
          <p className="text-lg text-slate-600 mb-8">
            The demo API accepts simulated FHIR bundles and lab CSV rows, and returns normalized records in the patient timeline. Real hospital connectivity is not configured.
          </p>

          <h2 className="text-2xl font-semibold mb-4">Authentication</h2>
          <p className="text-slate-600 mb-6">
            In this demo, use <code>X-API-Key: test-key-123</code>. This key is only enabled when demo mode is on. Every ingest request also requires an existing patient ID and active consent for the sending organization.
          </p>

          <h2 className="text-2xl font-semibold mb-4">Core Endpoints</h2>
          <div className="space-y-4 mb-8">
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-emerald-100 text-emerald-800 font-mono text-xs px-2 py-1 rounded">POST</span>
                <span className="font-mono text-sm font-semibold">/api/v1/ingest/bundle?patient_id=...</span>
              </div>
              <p className="text-sm text-slate-600">Accepts a FHIR Bundle with supported clinical resources. Patient ID must identify an existing patient with an active grant to this organization.</p>
            </div>
            
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-emerald-100 text-emerald-800 font-mono text-xs px-2 py-1 rounded">POST</span>
                <span className="font-mono text-sm font-semibold">/api/v1/ingest/csv?patient_id=...</span>
              </div>
              <p className="text-sm text-slate-600">CSV columns: test (or test_name), date, value, unit, and optional source. Requires an active observation grant.</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-blue-100 text-blue-800 font-mono text-xs px-2 py-1 rounded">GET</span>
                <span className="font-mono text-sm font-semibold">GET /api/v1/patients/lookup?abha=...</span>
              </div>
              <p className="text-sm text-slate-600">Looks up a patient by ABHA only when the caller's organization has active consent.</p>
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className="bg-slate-900 rounded-2xl shadow-xl overflow-hidden sticky top-6">
            <div className="bg-slate-800 px-4 py-3 flex items-center justify-between border-b border-slate-700">
              <div className="flex items-center gap-2 text-slate-400 text-sm font-mono">
                <Terminal className="h-4 w-4" /> Live Explorer
              </div>
              <button 
                onClick={runDemo}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center transition"
              >
                {loading ? "Running..." : <><Play className="h-3 w-3 mr-1" /> Send GET /demo/status</>}
              </button>
            </div>
            <div className="p-4 font-mono text-xs text-slate-300 h-96 overflow-y-auto">
              {response ? (
                <pre className="text-emerald-400">{JSON.stringify(response, null, 2)}</pre>
              ) : (
                <div className="text-slate-500 italic">Click "Send" to execute a live request against the backend.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
