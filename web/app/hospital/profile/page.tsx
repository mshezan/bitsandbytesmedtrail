"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchAPI } from "@/lib/api";
import { ArrowLeft, Stethoscope, UserRound } from "lucide-react";

export default function DoctorProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState("");
  useEffect(() => { fetchAPI("/me").then((result) => setUser(result.user)).catch((e: any) => setError(e.message || "Could not load your profile.")); }, []);
  return <main className="mx-auto max-w-2xl space-y-6">
    <Link href="/hospital/home" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:underline"><ArrowLeft className="h-4 w-4" /> Back to My Day</Link>
    <header><p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">Account</p><h1 className="mt-1 text-3xl font-bold text-slate-900">My profile</h1></header>
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
    {user ? <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-4 border-b border-slate-100 bg-slate-50 p-6"><div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><UserRound className="h-7 w-7" /></div><div><h2 className="text-xl font-bold text-slate-900">Dr. {user.name}</h2><p className="text-sm capitalize text-slate-500">{String(user.role).replaceAll("_", " ")}</p></div></div>
      <dl className="divide-y divide-slate-100 px-6"><ProfileField label="Email" value={user.email} /><ProfileField label="Phone" value={user.phone} /><div className="flex items-center gap-3 py-5"><Stethoscope className="h-5 w-5 text-emerald-700"/><div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Workspace</dt><dd className="mt-1 text-sm font-medium text-slate-800">MedTrail clinician portal</dd></div></div></dl>
    </section> : !error ? <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-8 text-slate-500">Loading profile…</div> : null}
  </main>;
}

function ProfileField({ label, value }: { label: string; value?: string | null }) {
  return <div className="flex items-center gap-3 py-5"><div className="h-5 w-5"/><div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</dt><dd className="mt-1 text-sm font-medium text-slate-800">{value || "Not provided"}</dd></div></div>;
}
