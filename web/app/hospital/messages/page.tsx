"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchAPI } from "@/lib/api";
import { Bell, FileText, MessageSquareText, ArrowUpRight } from "lucide-react";

export default function MessagesPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  useEffect(() => { fetchAPI("/hospital/inbox").then(setData).catch((e: any) => setError(e.message || "Could not load the inbox.")); }, []);
  return <main className="space-y-6">
    <header><p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">Your work queue</p><h1 className="mt-1 text-3xl font-bold text-slate-900">Inbox</h1><p className="mt-2 text-slate-600">A single view of results, diagnostic orders, and patient correction requests.</p></header>
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
    {!data ? !error && <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-8 text-slate-500">Loading your inbox…</div> : <div className="grid gap-4 md:grid-cols-3">
      <QueueCard icon={Bell} title="Results to review" count={data.results.filter((row: any) => !row.acknowledged).length} detail={`${data.results.length} result(s) from your organization`} href="/hospital/inbox" />
      <QueueCard icon={FileText} title="Diagnostic orders" count={data.orders.filter((row: any) => row.status === "active").length} detail={`${data.orders.length} order(s) recorded`} href="/hospital/inbox" />
      <QueueCard icon={MessageSquareText} title="Patient corrections" count={data.corrections.filter((row: any) => ["open", "under_review"].includes(row.status)).length} detail={`${data.corrections.length} request(s) for review`} href="/hospital/inbox" />
    </div>}
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><div><h2 className="font-semibold text-slate-900">Review your clinical queues</h2><p className="mt-1 text-sm text-slate-600">Acknowledgments and correction decisions are saved to the audit history.</p></div><Link href="/hospital/inbox" className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800">Open work queue <ArrowUpRight className="h-4 w-4" /></Link></div></section>
  </main>;
}

function QueueCard({ icon: Icon, title, count, detail, href }: any) {
  return <Link href={href} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md"><div className="flex items-start justify-between"><div className="rounded-xl bg-emerald-50 p-3 text-emerald-700"><Icon className="h-5 w-5" /></div><span className="text-2xl font-bold text-slate-900">{count}</span></div><h2 className="mt-4 font-semibold text-slate-900">{title}</h2><p className="mt-1 text-sm text-slate-500">{detail}</p></Link>;
}
