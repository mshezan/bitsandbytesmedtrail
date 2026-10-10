"use client";

import { useEffect, useState } from "react";
import { fetchAPI } from "@/lib/api";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle } from "lucide-react";

type RecordItem = { id: string; type: string; fhir: any; source_name: string; recorded_date: string; verified: boolean; patient_confirmed: boolean; source_type: string };

export default function ConfirmPage() {
  const router = useRouter();
  const [unverified, setUnverified] = useState<RecordItem[]>([]);
  const [editedNames, setEditedNames] = useState<Record<string, string>>({});
  const [editedFhir, setEditedFhir] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const extractedName = (r: RecordItem) => r.fhir?.code?.text || r.fhir?.medicationCodeableConcept?.text || r.fhir?.observation || "";
  function withExtractedName(r: RecordItem, value: string) {
    const fhir = { ...r.fhir };
    if (fhir.code) fhir.code = { ...fhir.code, text: value };
    else if (fhir.medicationCodeableConcept) fhir.medicationCodeableConcept = { ...fhir.medicationCodeableConcept, text: value };
    else fhir.observation = value;
    return fhir;
  }

  async function loadPending() {
    const records = await fetchAPI("/records?verified=false&source=upload");
    setUnverified(records.filter((r: RecordItem) => !r.patient_confirmed));
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        for (let attempt = 0; attempt < 10; attempt++) {
          const records = await fetchAPI("/records?verified=false&source=upload");
          if (cancelled) return;
          const pending = records.filter((r: RecordItem) => !r.patient_confirmed);
          setUnverified(pending);
          if (pending.length || attempt === 9) break;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (e: any) { if (!cancelled) setError(e.message); }
      finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  async function confirm(record: RecordItem) {
    try {
      const edited = editedNames[record.id];
      let fhir = editedFhir[record.id] || record.fhir;
      if (edited !== undefined && edited !== extractedName(record)) fhir = withExtractedName({ ...record, fhir }, edited);
      if (JSON.stringify(fhir) !== JSON.stringify(record.fhir)) {
        await fetchAPI(`/records/${record.id}`, { method: "PATCH", body: JSON.stringify({ fhir }) });
      }
      await fetchAPI(`/records/${record.id}/confirm`, { method: "POST" });
      setUnverified(prev => prev.filter(r => r.id !== record.id));
    } catch (e: any) { setError(e.message); }
  }

  async function discard(id: string) {
    try {
      await fetchAPI(`/records/${id}`, { method: "DELETE" });
      setUnverified(prev => prev.filter(r => r.id !== id));
    } catch (e: any) { setError(e.message); }
  }

  if (loading) return <div className="p-8 text-slate-500">Loading extracted records…</div>;
  return <div className="mx-auto max-w-3xl space-y-6">
    <header><p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">External provider upload</p><h1 className="mt-1 text-3xl font-bold">Review extracted data</h1><p className="mt-2 text-slate-600">Edit details before confirming. Confirmed uploads remain unverified until a clinician reviews them.</p></header>
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
    {unverified.length === 0 ? <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center"><CheckCircle className="mx-auto h-10 w-10 text-emerald-700"/><h2 className="mt-3 text-xl font-semibold">No extracted records awaiting confirmation</h2><p className="mt-2 text-slate-600">Confirmed uploads are still marked unverified until a clinician reviews them.</p><button onClick={() => router.push("/patient/timeline")} className="mt-5 rounded-lg bg-emerald-800 px-4 py-2 font-semibold text-white">Go to Timeline</button></section> : <div className="space-y-4">
      {unverified.map(r => <article key={r.id} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2"><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">{r.type} · Not verified</span><span className="text-sm text-slate-500">{r.recorded_date} · {r.source_name}</span></div>
        <label className="block text-sm font-medium">Extracted detail<input value={editedNames[r.id] ?? extractedName(r)} onChange={e => setEditedNames(prev => ({ ...prev, [r.id]: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"/></label>
        {r.type === "observation" && r.fhir?.valueQuantity && <p className="text-sm text-slate-600">Value: {r.fhir.valueQuantity.value} {r.fhir.valueQuantity.unit || ""}</p>}
        {r.type === "medication" && <label className="block text-sm font-medium">Dose / instructions<input value={(editedFhir[r.id] || r.fhir).dosage?.[0]?.text || (editedFhir[r.id] || r.fhir).dosageInstruction?.[0]?.text || ""} onChange={e => setEditedFhir(prev => ({...prev, [r.id]: {...(prev[r.id] || r.fhir), dosage: [{text: e.target.value}]}}))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"/></label>}
        <div className="flex flex-wrap justify-end gap-2"><button onClick={() => discard(r.id)} className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 font-medium text-rose-700"><XCircle className="h-4 w-4"/>Discard upload</button><button onClick={() => confirm(r)} className="flex items-center gap-2 rounded-lg bg-emerald-800 px-4 py-2 font-semibold text-white"><CheckCircle className="h-4 w-4"/>Confirm as unverified</button></div>
      </article>)}
    </div>}
  </div>;
}
