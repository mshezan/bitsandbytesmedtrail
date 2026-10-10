'use client';

import { useEffect, useState } from 'react';
import { fetchAPI } from '@/lib/api';
import { Copy, History, Link2 } from 'lucide-react';

type Share = { id: string; scope: { types?: string[] }; expires_at: string; is_active: boolean; is_emergency: boolean };
type Audit = { id: string; actor_type: string; actor_label: string; action: string; detail?: string; created_at: string };

export default function ShareAccess() {
  const [duration, setDuration] = useState(24);
  const [scope, setScope] = useState(['condition', 'medication', 'allergy', 'observation', 'encounter', 'report']);
  const [shares, setShares] = useState<Share[]>([]);
  const [audit, setAudit] = useState<Audit[]>([]);
  const [shareUrl, setShareUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function refresh() {
    const [events, links] = await Promise.all([fetchAPI('/audit'), fetchAPI('/shares')]);
    setAudit(events); setShares(links);
  }
  useEffect(() => { refresh().catch(e => setError(e.message)); }, []);
  function toggle(type: string) { setScope(current => current.includes(type) ? current.filter(x => x !== type) : [...current, type]); }
  async function createShare() {
    setBusy(true); setError('');
    try { const data = await fetchAPI('/shares', { method: 'POST', body: JSON.stringify({ scope: { types: scope }, expires_in_hours: duration }) }); setShareUrl(data.url); await refresh(); }
    catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }
  async function revokeShare(id: string) {
    setBusy(true); setError('');
    try { await fetchAPI(`/shares/${id}`, { method: 'DELETE' }); await refresh(); }
    catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }
  return <div className="space-y-6">
    <header><p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">Care record activity</p><h1 className="mt-1 text-3xl font-bold text-slate-900">Sharing & access</h1><p className="mt-2 text-slate-600">Your participating care providers can view your record. Every chart view is logged here. You can also create a time-limited link for a provider outside the network.</p></header>
    {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</div>}
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="flex items-center gap-2 text-lg font-semibold"><Link2 className="h-5 w-5 text-emerald-700"/>Create a secure link</h2>
      <p className="mt-1 text-sm text-slate-600">Make a temporary, read-only link for a clinician who is not on MedTrail.</p>
      <fieldset className="mt-4"><legend className="text-sm font-medium">Record categories</legend><div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">{[['condition','Conditions'],['medication','Medications'],['allergy','Allergies'],['observation','Lab results'],['encounter','Visits'],['report','Reports']].map(([key,label]) => <label key={key} className="flex items-center gap-2 rounded-lg bg-slate-50 p-2 text-sm"><input type="checkbox" checked={scope.includes(key)} onChange={() => toggle(key)} />{label}</label>)}</div></fieldset>
      <label className="mt-4 block max-w-xs text-sm font-medium">Link duration<select value={duration} onChange={e => setDuration(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"><option value={1}>1 hour</option><option value={24}>24 hours</option><option value={168}>7 days</option><option value={720}>30 days</option></select></label>
      <button disabled={busy || !scope.length} onClick={createShare} className="mt-5 rounded-lg bg-emerald-800 px-4 py-2.5 font-semibold text-white hover:bg-emerald-900 disabled:opacity-50">{busy?'Working…':'Generate secure link'}</button>
      {shareUrl && <div className="mt-4 flex gap-2"><input readOnly value={shareUrl} className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm"/><button aria-label="Copy link" onClick={() => navigator.clipboard.writeText(shareUrl)} className="rounded-lg border border-slate-300 p-2"><Copy className="h-4 w-4"/></button></div>}
    </section>
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-semibold">Secure links</h2><div className="mt-4 divide-y divide-slate-100">{shares.length ? shares.map(s=><div key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="font-medium">{s.is_emergency?'Emergency card':'Temporary record share'}</p><p className="text-sm text-slate-600">{(s.scope?.types||[]).join(', ')} · expires {new Date(s.expires_at).toLocaleString()}</p></div>{s.is_active?<button disabled={busy} onClick={()=>revokeShare(s.id)} className="rounded-lg border border-rose-200 px-3 py-1.5 text-sm text-rose-700 hover:bg-rose-50">Revoke link</button>:<span className="text-sm text-slate-500">Inactive</span>}</div>) : <p className="py-4 text-sm text-slate-500">No secure links created.</p>}</div></section>
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="flex items-center gap-2 text-lg font-semibold"><History className="h-5 w-5 text-slate-500"/>Who viewed your record</h2><div className="mt-4 divide-y divide-slate-100">{audit.length ? audit.map(a => <div key={a.id} className="py-3"><p className="font-medium">{a.actor_label} <span className="font-normal text-slate-600">{a.action.toLowerCase()}</span></p><p className="text-sm text-slate-500">{a.detail || (a.actor_type==='clinician'?'Clinician access recorded':'')} · {new Date(a.created_at).toLocaleString()}</p></div>) : <p className="py-4 text-sm text-slate-500">No record views have been logged yet.</p>}</div></section>
  </div>;
}
