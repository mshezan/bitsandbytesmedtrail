'use client';
import { useEffect, useState } from 'react';
import { fetchAPI } from '@/lib/api';
import { FlaskConical } from 'lucide-react';
type Result = { date: string; value: number | null; unit?: string; source: string };
export default function Labs() {
 const [labs,setLabs]=useState<Record<string,Result[]>>({});const [query,setQuery]=useState('');const [error,setError]=useState('');
 useEffect(()=>{fetchAPI('/labs/by-test').then(d=>setLabs(d.labs||{})).catch(e=>setError(e.message));},[]);
 const groups=Object.entries(labs).filter(([name])=>name.toLowerCase().includes(query.toLowerCase()));
 return <div className="space-y-6"><header><p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">Test history</p><h1 className="mt-1 text-3xl font-bold">Lab results</h1><p className="mt-2 text-slate-600">Results are grouped by test across your recorded providers. Reference ranges depend on the reporting lab.</p></header><input aria-label="Search tests" placeholder="Search tests" value={query} onChange={e=>setQuery(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 md:max-w-md"/>{error&&<p role="alert" className="rounded-xl bg-rose-50 p-3 text-rose-800">{error}</p>}<div className="grid gap-4 md:grid-cols-2">{groups.map(([name,results])=><section key={name} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="flex items-center gap-2 text-lg font-semibold"><FlaskConical className="h-5 w-5 text-emerald-800"/>{name}</h2><div className="mt-4 space-y-2">{[...results].sort((a,b)=>b.date.localeCompare(a.date)).map((r,i)=><div key={`${r.date}-${i}`} className="flex justify-between gap-3 rounded-lg bg-slate-50 p-3"><div><p className="font-medium">{r.value ?? 'Value not captured'} {r.unit||''}</p><p className="text-xs text-slate-500">{r.source}</p></div><time className="text-sm text-slate-600">{r.date}</time></div>)}</div></section>)}{groups.length===0&&<p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">No lab results found.</p>}</div></div>;
}
