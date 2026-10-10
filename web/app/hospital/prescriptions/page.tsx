"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { fetchAPI } from "@/lib/api";
import { Pill, Search } from "lucide-react";

export default function PrescriptionsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setError("");
    try { setRows(await fetchAPI("/hospital/prescriptions")); }
    catch (e: any) { setError(e.message || "Could not load prescriptions."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  return <main className="space-y-6">
    <header><p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">Medication orders</p><h1 className="mt-1 text-3xl font-bold text-slate-900">Prescriptions</h1><p className="mt-2 text-slate-600">Prescriptions you issued to patients with an active medication consent.</p></header>
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
    {loading ? <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-8 text-slate-500">Loading prescriptions…</div> : rows.length ? <div className="space-y-3">{rows.map(row => <article key={row.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex min-w-0 items-start gap-3"><div className="rounded-xl bg-emerald-50 p-3 text-emerald-700"><Pill className="h-5 w-5" /></div><div><h2 className="font-semibold text-slate-900">{row.medication} {row.dose && <span className="font-normal text-slate-600">· {row.dose}</span>}</h2><p className="mt-1 text-sm text-slate-600">{row.patient_name} · {row.date}</p><p className="mt-1 text-xs text-slate-500">{row.rx_id} · {row.status}</p></div></div><Link href={`/hospital/patient/${row.patient_id}/consult`} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-600 hover:text-emerald-700">Open chart</Link></article>)}</div> : <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><Pill className="mx-auto h-8 w-8 text-slate-300" /><h2 className="mt-3 font-semibold text-slate-800">No prescriptions issued yet</h2><p className="mt-1 text-sm text-slate-500">Open a patient chart to compose and sign a prescription.</p><Link href="/hospital/search" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"><Search className="h-4 w-4" /> Find a patient</Link></div>}
  </main>;
}
