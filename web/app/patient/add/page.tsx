"use client";

import { useState, useEffect } from "react";
import { fetchAPI } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Upload, RefreshCw, Hospital } from "lucide-react";

export default function AddRecordsPage() {
  const router = useRouter();
  const [connectors, setConnectors] = useState<{ id: string; name: string }[]>([]);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sourceName, setSourceName] = useState("");

  useEffect(() => {
    fetchAPI("/connectors").then(setConnectors).catch(console.error);
  }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);
    formData.append("source_name", sourceName);

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiBase}/uploads`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${localStorage.getItem("medtrail_token")}` },
        body: formData,
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.detail || "Upload failed");
      }
      router.push("/patient/confirm");
    } catch (err: any) {
      setError(err.message);
      setUploading(false);
    }
  }

  async function handleSync(id: string) {
    setSyncing(id);
    try {
      const res = await fetchAPI(`/connectors/${id}/sync`, { method: "POST" });
      setMessage(`Sync complete. ${res.imported_count} records added.`);
      router.push("/patient/timeline");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSyncing(null);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <header className="mb-10 flex items-center gap-4">
        <button
          onClick={() => window.history.back()}
          className="rounded-full bg-neutral-100 p-2 text-neutral-500 hover:bg-neutral-200"
        >
          &larr; Back
        </button>
        <div>
          <h1 className="text-3xl font-semibold">Add Records</h1>
          <p className="mt-1 text-neutral-500">Upload documents or sync from providers.</p>
        </div>
      </header>
      {error && <p role="alert" className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      {message && <p role="status" className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">{message}</p>}

      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold">Upload Document</h2>
        <label className="mb-4 block text-sm font-medium text-slate-700">External hospital or clinic (must not be connected to MedTrail)
          <input value={sourceName} onChange={e => setSourceName(e.target.value)} required minLength={3} maxLength={200} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3" placeholder="Name of the outside provider" />
        </label>
        <p className="mb-3 text-sm text-slate-600">For providers outside this system only. Records from connected organizations must arrive through their API integration.</p>
        <label className={`flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed ${uploading ? 'opacity-50' : 'hover:bg-neutral-100'} border-neutral-300 bg-mist py-12 text-center`}>
          <Upload className="mb-3 h-8 w-8 text-neutral-400" />
          <p className="font-medium text-neutral-700">{uploading ? "Uploading and extracting..." : "Drag & drop your file here"}</p>
          <p className="text-sm text-neutral-500">or click to browse (PDF, JPG, PNG)</p>
          <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleUpload} disabled={uploading || sourceName.trim().length < 3} />
        </label>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Sync from Hospital</h2>
        <p className="mb-4 text-sm text-neutral-500">Connect to your provider's patient portal to pull records automatically.</p>
        
        <div className="flex flex-col gap-4">
          {connectors.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sage/10 text-sage">
                  <Hospital className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900">{c.name}</h3>
                  <p className="text-sm text-neutral-500">Synthetic demo source</p>
                </div>
              </div>
              <button
                onClick={() => handleSync(c.id)}
                disabled={syncing === c.id}
                className="flex items-center gap-2 rounded-xl bg-neutral-100 px-4 py-2 font-medium text-neutral-700 hover:bg-neutral-200 disabled:opacity-50"
              >
                {syncing === c.id ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Sync
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
