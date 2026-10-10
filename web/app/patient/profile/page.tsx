'use client';
import { FormEvent, useEffect, useState } from 'react';
import { fetchAPI } from '@/lib/api';

type ProfileData = { user: any; patient: any };
const empty = { phone: '', email: '', emergency: '', address: '', city: '', state: '', language: '', preferred_hospital: '', profile_photo_url: '' };

export default function Profile() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [form, setForm] = useState(empty);
  const [notificationPrefs, setNotificationPrefs] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    const p = await fetchAPI('/me');
    setProfile(p);
    setForm({ phone: p.user.phone || '', email: p.user.email || '', emergency: p.patient?.emergency_contact || '', address: p.patient?.address || '', city: p.patient?.city || '', state: p.patient?.state || '', language: p.patient?.language || '', preferred_hospital: p.patient?.preferred_hospital || '', profile_photo_url: p.patient?.profile_photo_url || '' });
    setNotificationPrefs(p.patient?.notification_preferences || {});
  }
  useEffect(() => { load().catch(e => setError(e.message)); }, []);

  async function save(e: FormEvent) {
    e.preventDefault(); setError(''); setMessage(''); setSaving(true);
    try { await fetchAPI('/auth/me', { method: 'PATCH', body: JSON.stringify({...form, notification_preferences: notificationPrefs}) }); await load(); setMessage('Your contact and preference details were saved.'); }
    catch (e: any) { setError(e.message); } finally { setSaving(false); }
  }
  if (!profile) return <div className="p-8 text-slate-500">Loading profile…</div>;
  const p = profile.patient || {};
  return <div className="mx-auto max-w-3xl space-y-6">
    <header><p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">Account</p><h1 className="mt-1 text-3xl font-bold">My Profile</h1><p className="mt-2 text-slate-600">Update your contact information and preferences. Clinical identity details require review.</p></header>
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-rose-800">{error}</p>}{message && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-emerald-900">{message}</p>}
    <form onSubmit={save} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-semibold">Contact and preferences</h2><div className="grid gap-4 sm:grid-cols-2">
      {([['phone','Phone'],['email','Email'],['emergency','Emergency contact'],['address','Street address'],['city','City'],['state','State'],['language','Preferred language'],['preferred_hospital','Preferred hospital'],['profile_photo_url','Profile photo URL']] as const).map(([key,label])=><label key={key} className="block text-sm font-medium">{label}<input type={key==='email'?'email':'text'} value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"/></label>)}
    </div><h3 className="pt-2 font-semibold">Notifications</h3>{['care_updates','sharing_activity','reminders'].map(key=><label key={key} className="mr-5 inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={notificationPrefs[key] !== false} onChange={e=>setNotificationPrefs({...notificationPrefs,[key]:e.target.checked})}/>{key.replace('_',' ')}</label>)}<button disabled={saving} className="block rounded-lg bg-emerald-800 px-4 py-2.5 font-semibold text-white disabled:opacity-50">{saving?'Saving…':'Save profile'}</button></form>
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div><h2 className="text-lg font-semibold">Identity details</h2><p className="mt-1 text-sm text-slate-600">These clinical identity details are maintained by your care providers.</p></div><dl className="grid gap-3 sm:grid-cols-2">{[['Name',profile.user.name],['Date of birth',p.dob],['Sex',p.sex],['Blood group',p.blood_group],['ABHA number',p.abha_number]].map(([k,v])=><div key={k}><dt className="text-xs text-slate-500">{k}</dt><dd className="font-medium">{v||'Not recorded'}</dd></div>)}</dl>
    </section>
  </div>;
}
