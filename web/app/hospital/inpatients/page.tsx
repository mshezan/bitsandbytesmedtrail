"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bed, Activity, UserPlus, FileText, Search, AlertCircle } from "lucide-react";
import { fetchAPI } from "@/lib/api";

type PatientRow = { id: string; name: string; phone?: string; city?: string };

export default function InpatientsBoard() {
  const router = useRouter();
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchAPI("/hospital/my-day").then(data => setPatients(data.recent_patients || []))
      .catch((e: any) => setError(e.message || "Could not load your patients."))
      .finally(() => setLoading(false));
  }, []);

  return <div className="flex min-h-screen flex-col bg-slate-50">
    <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 py-6 md:px-8"><div><p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">Hospital workspace</p><h1 className="mt-1 text-3xl font-bold text-slate-900">Inpatient Wards</h1><p className="mt-2 text-slate-500">Open a patient chart to add daily notes or review their record.</p></div><button onClick={() => router.push("/hospital/search")} className="flex items-center gap-2 rounded-xl bg-emerald-800 px-5 py-2.5 font-bold text-white transition hover:bg-emerald-900"><UserPlus className="h-5 w-5"/>Find patient</button></header>
    <main className="flex-1 space-y-8 overflow-y-auto p-6 md:p-8"><section><h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-800"><Bed className="text-emerald-700"/>Recent patient charts</h2>{error && <p role="alert" className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-rose-800"><AlertCircle className="h-4 w-4"/>{error}</p>}{loading ? <p className="rounded-2xl bg-white p-6 text-slate-500">Loading patient charts…</p> : patients.length ? <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">{patients.map(patient => <article key={patient.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-3 flex items-start justify-between"><span className="rounded bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">Patient chart</span><span className="flex items-center gap-1 text-xs font-medium text-emerald-700"><Activity className="h-3 w-3"/>Available</span></div><h3 className="text-lg font-bold text-slate-900">{patient.name}</h3><p className="mb-4 mt-1 text-sm text-slate-500">{patient.phone || "Contact not listed"}{patient.city ? ` · ${patient.city}` : ""}</p><div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-3"><button onClick={() => router.push(`/hospital/patient/${patient.id}/consult?mode=daily-notes`)} className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800 hover:bg-emerald-100"><FileText className="h-4 w-4"/>Daily Notes</button><button onClick={() => router.push(`/hospital/patient/${patient.id}/consult`)} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"><Search className="h-4 w-4"/>Open Chart</button></div></article>)}</div> : <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center"><p className="font-semibold text-slate-700">No recent patient charts found.</p><button onClick={() => router.push("/hospital/search")} className="mt-3 font-bold text-emerald-800 underline">Search patients</button></div>}</section></main>
  </div>;
}
