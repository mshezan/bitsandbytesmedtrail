"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { fetchAPI } from "@/lib/api";
import { Forward, Search } from "lucide-react";

export default function ReferralsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setError("");
    try { setRows(await fetchAPI("/hospital/referrals")); }
    catch (e: any) { setError(e.message || "Could not load referrals."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  return <main className="space-y-6">
    <header><p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">Care coordination</p><h1 className="mt-1 text-3xl font-bold text-slate-900">Referrals</h1><p className="mt-2 text-slate-600">Track referral packets sent from your patient consultations.</p></header>
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
    {loading ? <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-8 text-slate-500">Loading referrals…</div> : rows.length ? <div className="space-y-3">{rows.map(row => <article key={row.id} className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex gap-3"><div className="rounded-xl bg-emerald-50 p-3 text-emerald-700"><Forward className="h-5 w-5" /></div><div><h2 className="font-semibold text-slate-900">{row.patient_name} · {row.specialty}</h2><p className="mt-1 text-sm text-slate-600">To {row.organization} · {row.date}</p><p className="mt-2 max-w-2xl text-sm text-slate-700">{row.reason}</p><p className="mt-2 text-xs font-medium uppercase text-slate-500">{row.referral_id} · {row.urgency} · {row.status}</p></div></div><Link href={`/hospital/patient/${row.patient_id}/consult`} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-600 hover:text-emerald-700">Open chart</Link></article>)}</div> : <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><Forward className="mx-auto h-8 w-8 text-slate-300" /><h2 className="mt-3 font-semibold text-slate-800">No referrals sent yet</h2><p className="mt-1 text-sm text-slate-500">Open a patient chart to prepare and send a referral.</p><Link href="/hospital/search" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"><Search className="h-4 w-4" /> Find a patient</Link></div>}
  </main>;
}
