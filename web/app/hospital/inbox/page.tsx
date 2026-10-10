"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchAPI } from "@/lib/api";
import { AlertTriangle, Bell, Check, FileText, Search } from "lucide-react";

type InboxData = { results: any[]; orders: any[]; corrections: any[] };

export default function InboxPage() {
  const [data, setData] = useState<InboxData>({ results: [], orders: [], corrections: [] });
  const [tab, setTab] = useState("results");
  const [filter, setFilter] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setError("");
    try { setData(await fetchAPI("/hospital/inbox")); }
    catch (e: any) { setError(e.message || "Could not load the hospital inbox."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function acknowledge(id: string) {
    setBusy(id); setError("");
    try {
      await fetchAPI(`/hospital/inbox/${id}/acknowledge`, { method: "POST" });
      setData(current => ({ ...current, results: current.results.map(r => r.id === id ? { ...r, acknowledged: true } : r) }));
    } catch (e: any) { setError(e.message || "Could not acknowledge this result."); }
    finally { setBusy(null); }
  }

  async function reviewCorrection(row: any, action: "under_review" | "accepted" | "rejected") {
    const reason = window.prompt(action === "under_review" ? "Optional note for the review" : "Enter the resolution reason");
    if (reason === null) return;
    if (action !== "under_review" && !reason.trim()) { setError("A resolution reason is required."); return; }
    setBusy(row.id); setError("");
    try {
      await fetchAPI(`/hospital/inbox/corrections/${row.id}/review`, {
        method: "POST", body: JSON.stringify({ action, reason: reason.trim() || "Review started" }),
      });
      await loadData();
    } catch (e: any) { setError(e.message || "Could not update this correction request."); }
    finally { setBusy(null); }
  }

  const results = useMemo(() => data.results.filter(r =>
    `${r.patient_name} ${r.test} ${r.value}`.toLowerCase().includes(filter.toLowerCase())), [data.results, filter]);

  if (loading) return <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-8 text-slate-500">Loading orders and results…</div>;

  return <main className="space-y-6">
    <header>
      <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">Clinical work queue</p>
      <h1 className="mt-1 text-3xl font-bold text-slate-900">Orders &amp; Results</h1>
      <p className="mt-2 text-slate-600">Review results, follow diagnostic orders, and resolve patient correction requests.</p>
    </header>
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}

    <div className="flex flex-wrap gap-2 border-b border-slate-200">
      {[["results", "Results", Bell, data.results.filter(r => !r.acknowledged).length], ["orders", "My Orders", FileText, data.orders.length], ["corrections", "Corrections", AlertTriangle, data.corrections.filter(r => ["open", "under_review"].includes(r.status)).length]].map(([key, label, Icon, count]: any) =>
        <button key={key} onClick={() => setTab(key)} className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold ${tab === key ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
          <Icon className="h-4 w-4" /> {label}<span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{count}</span>
        </button>)}
    </div>

    {tab === "results" && <section className="space-y-4">
      <label className="relative block max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filter by patient or test" className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-600" />
      </label>
      {results.length ? results.map(r => <article key={r.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><div className="flex items-center gap-2"><h2 className="font-semibold text-slate-900">{r.patient_name}</h2><span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${r.flag === "abnormal" || r.flag === "critical" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"}`}>{r.flag}</span></div><p className="mt-1 text-sm text-slate-600">{r.test} · {r.date}</p></div>
          <strong className="text-lg text-slate-900">{r.value}</strong>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
          {r.acknowledged ? <span className="inline-flex items-center gap-1 text-sm text-emerald-700"><Check className="h-4 w-4" /> Acknowledged</span> : <button disabled={busy === r.id} onClick={() => acknowledge(r.id)} className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">Acknowledge result</button>}
          <Link href={`/hospital/patient/${r.patient_id}/consult`} className="ml-auto rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-600 hover:text-emerald-700">Open chart</Link>
        </div>
      </article>) : <Empty title={filter ? "No matching results" : "No results to review"} detail={filter ? "Try another patient name or test." : "Verified lab results from your organization will appear here."} />}
    </section>}

    {tab === "orders" && <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {data.orders.length ? <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50 text-slate-500"><tr><th className="px-5 py-3 font-semibold">Order</th><th className="px-5 py-3 font-semibold">Patient</th><th className="px-5 py-3 font-semibold">Test / Procedure</th><th className="px-5 py-3 font-semibold">Status</th><th className="px-5 py-3 font-semibold">Priority</th><th className="px-5 py-3 text-right font-semibold">Chart</th></tr></thead><tbody className="divide-y divide-slate-100">{data.orders.map(o => <tr key={o.record_id} className="hover:bg-slate-50"><td className="px-5 py-4 font-mono text-xs text-slate-500">{o.id}</td><td className="px-5 py-4 font-semibold text-slate-900">{o.patient_name}</td><td className="px-5 py-4">{o.test}</td><td className="px-5 py-4 capitalize">{o.status}</td><td className="px-5 py-4 capitalize">{o.priority}</td><td className="px-5 py-4 text-right"><Link href={`/hospital/patient/${o.patient_id}/consult`} className="font-semibold text-emerald-700 hover:underline">Open chart</Link></td></tr>)}</tbody></table></div> : <Empty title="No diagnostic orders yet" detail="Orders you place from a patient consultation will appear here." />}
    </section>}

    {tab === "corrections" && <section className="space-y-3">
      {data.corrections.length ? data.corrections.map(row => <article key={row.id} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold capitalize text-amber-900">{row.status.replaceAll("_", " ")}</span><h2 className="mt-3 font-semibold">{row.patient_name} · {row.record || row.disputed_field}</h2><p className="mt-1 text-sm text-slate-500">{row.date} · {row.disputed_field}</p></div><Link href={row.record_id ? `/hospital/patient/${row.patient_id}/consult` : `/hospital/patient/${row.patient_id}`} className="text-sm font-semibold text-emerald-700 hover:underline">Open chart</Link></div>
        <div className="grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2"><p className="text-sm"><strong>Patient says:</strong><br />{row.believed_correct || row.patient_comment}</p><p className="text-sm"><strong>Record:</strong><br />{row.disputed_field}</p></div>
        {["open", "under_review"].includes(row.status) && <div className="flex flex-wrap gap-2"><button disabled={busy === row.id} onClick={() => reviewCorrection(row, "under_review")} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">Mark under review</button><button disabled={busy === row.id} onClick={() => reviewCorrection(row, "accepted")} className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white">Accept and amend</button><button disabled={busy === row.id} onClick={() => reviewCorrection(row, "rejected")} className="rounded-lg border border-rose-200 px-3 py-2 text-sm text-rose-700">Reject</button></div>}
      </article>) : <Empty title="No correction requests" detail="Patient-submitted correction requests for your organization will appear here." />}
    </section>}
  </main>;
}

function Empty({ title, detail }: { title: string; detail: string }) {
  return <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><FileText className="mx-auto h-8 w-8 text-slate-300" /><h2 className="mt-3 font-semibold text-slate-800">{title}</h2><p className="mt-1 text-sm text-slate-500">{detail}</p></div>;
}
