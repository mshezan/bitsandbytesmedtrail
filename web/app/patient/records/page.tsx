'use client';
import { useEffect, useMemo, useState } from 'react';
import { fetchAPI } from '@/lib/api';
import { FileText, Search } from 'lucide-react';

type RecordRow = { id: string; type: string; fhir: any; source_name: string; recorded_date: string; verified: boolean; source_type: string; status: string };
const title = (r: RecordRow) => r.fhir?.code?.text || r.fhir?.medicationCodeableConcept?.text || r.fhir?.medication?.text || r.fhir?.medication || r.fhir?.type?.[0]?.text || r.fhir?.observation || r.type;
const detail = (r: RecordRow) => r.fhir?.reasonCode?.[0]?.text || r.fhir?.conclusion || r.fhir?.valueQuantity?.value && `${r.fhir.valueQuantity.value} ${r.fhir.valueQuantity.unit || ''}` || '';

export default function RecordsPage() {
  const [records, setRecords] = useState<RecordRow[]>([]); const [error, setError] = useState(''); const [query, setQuery] = useState(''); const [kind, setKind] = useState('all');
  useEffect(() => { fetchAPI('/records').then(setRecords).catch(e => setError(e.message)); }, []);
  const visible = useMemo(() => records.filter(r => (kind === 'all' || r.type === kind) && (!query || `${title(r)} ${r.source_name} ${r.type} ${detail(r)}`.toLowerCase().includes(query.toLowerCase()))), [records, kind, query]);
  const categories = [['all','All records'],['encounter','Visits'],['condition','Conditions'],['medication','Medications'],['observation','Lab results'],['report','Reports'],['allergy','Allergies']];
  return <div className="space-y-6"><header><p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">Your health record</p><h1 className="mt-1 text-3xl font-bold">Medical records</h1><p className="mt-2 text-slate-600">A chronological, searchable view of records shared by your care providers. Provider-issued records are read-only here.</p></header>
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-rose-800">{error}</p>}
    <div className="flex flex-wrap gap-2">{categories.map(([value,label]) => <button key={value} onClick={() => setKind(value)} className={`rounded-full px-3 py-1.5 text-sm ${kind === value ? 'bg-emerald-800 text-white' : 'border border-slate-300 bg-white text-slate-700'}`}>{label}</button>)}</div>
    <label className="flex max-w-xl items-center gap-2 rounded-xl border border-slate-300 bg-white px-3"><Search className="h-4 w-4 text-slate-400"/><input aria-label="Search medical records" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search condition, test, provider, or visit" className="w-full py-3 outline-none"/></label>
    <section className="space-y-3">{visible.map(r => <article key={r.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold capitalize text-emerald-900">{r.type === 'observation' ? 'Lab result' : r.type}</span><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${r.verified ? 'bg-slate-100 text-slate-700' : 'bg-amber-100 text-amber-900'}`}>{r.verified ? 'Provider verified' : r.source_type === 'self_reported' ? 'Self-reported' : 'Awaiting verification'}</span></div><h2 className="mt-3 font-semibold text-slate-900">{title(r)}</h2>{detail(r) && <p className="mt-1 text-sm text-slate-600">{detail(r)}</p>}<p className="mt-2 text-sm text-slate-600">{r.source_name}</p></div><time className="shrink-0 text-sm text-slate-500">{r.recorded_date}</time></div></article>)}
      {visible.length === 0 && <div className="rounded-2xl border border-slate-200 bg-white p-9 text-center text-slate-600"><FileText className="mx-auto mb-3 h-7 w-7 text-slate-400"/><p className="font-medium">{records.length ? 'No records match this search.' : 'No records have been shared yet.'}</p><p className="mt-1 text-sm">Records from connected providers will appear here as they become available.</p></div>}</section>
  </div>;
}
