'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { API } from '@/lib/api';
import { AlertTriangle, Activity, Pill, ShieldAlert } from 'lucide-react';

type Card = { patient: { name: string; dob: string; blood_group?: string; emergency_contact?: string }; records: { type: string; fhir: any }[] };
export default function EmergencyAccess() {
  const params = useParams<{ token: string }>();
  const [data, setData] = useState<Card | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { fetch(`${API}/emergency/${params.token}`).then(async r => { if (!r.ok) throw new Error((await r.json()).detail || 'This emergency link is unavailable.'); return r.json(); }).then(setData).catch(e => setError(e.message)); }, [params.token]);
  const list = (type: string) => data?.records.filter(r => r.type === type) || [];
  const label = (r: { type: string; fhir: any }) => r.fhir?.code?.text || r.fhir?.medicationCodeableConcept?.text || r.fhir?.medication || r.fhir?.allergy || 'Not specified';
  if (error) return <main className="mx-auto max-w-xl p-8"><h1 className="text-2xl font-bold">Emergency record unavailable</h1><p className="mt-2 text-slate-600">{error}</p></main>;
  if (!data) return <main className="p-8 text-center text-slate-600">Loading emergency record…</main>;
  const age = new Date().getFullYear() - new Date(data.patient.dob).getFullYear();
  return <main className="min-h-screen bg-rose-700 p-4 text-slate-900 md:p-8"><div className="mx-auto max-w-3xl"><header className="mb-6 flex items-center gap-3 text-white"><ShieldAlert className="h-7 w-7"/><div><p className="text-sm font-bold uppercase tracking-widest">Emergency access</p><p className="text-sm text-rose-100">Verified critical information · access is logged</p></div></header><section className="rounded-3xl bg-white p-6 shadow-xl md:p-9"><div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-6"><div><h1 className="text-3xl font-bold">{data.patient.name}</h1><p className="mt-1 text-slate-600">{age} years · DOB {data.patient.dob}</p></div><div className="rounded-xl bg-rose-50 px-4 py-3 text-rose-800"><span className="block text-xs font-semibold uppercase">Blood group</span><strong className="text-xl">{data.patient.blood_group || 'Unknown'}</strong></div></div><div className="mt-6 space-y-6">{[['allergy','Critical allergies',AlertTriangle],['condition','Conditions',Activity],['medication','Medications',Pill]].map(([type,title,Icon]: any) => <section key={type}><h2 className="mb-3 flex items-center gap-2 font-semibold"><Icon className="h-5 w-5 text-rose-700"/>{title}</h2><div className="flex flex-wrap gap-2">{list(type).length ? list(type).map((r,i)=><span key={i} className="rounded-lg bg-slate-100 px-3 py-2 text-sm">{label(r)}</span>) : <span className="text-sm text-slate-500">No verified record</span>}</div></section>)}{data.patient.emergency_contact && <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-semibold uppercase text-slate-500">Emergency contact</p><p className="mt-1 font-medium">{data.patient.emergency_contact}</p></div>}</div></section></div></main>;
}
