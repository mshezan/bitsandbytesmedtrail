'use client';
import { FormEvent, useEffect, useState } from 'react';
import { fetchAPI } from '@/lib/api';

type ProfileData = { user: any; patient: any };
const empty = { phone: '', email: '', emergency: '', address: '', city: '', state: '', language: '', preferred_hospital: '', profile_photo_url: '' };

export default function Profile() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [form, setForm] = useState(empty);
  const [notificationPrefs, setNotificationPrefs] = useState<Record<string, boolean>>({});
  const [privacyPrefs, setPrivacyPrefs] = useState<Record<string, boolean>>({});
  const [orgCode, setOrgCode] = useState('');
  const [identityField, setIdentityField] = useState('dob');
  const [identityValue, setIdentityValue] = useState('');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    const p = await fetchAPI('/me');
    setProfile(p);
    setForm({ phone: p.user.phone || '', email: p.user.email || '', emergency: p.patient?.emergency_contact || '', address: p.patient?.address || '', city: p.patient?.city || '', state: p.patient?.state || '', language: p.patient?.language || '', preferred_hospital: p.patient?.preferred_hospital || '', profile_photo_url: p.patient?.profile_photo_url || '' });
    setNotificationPrefs(p.patient?.notification_preferences || {});
    setPrivacyPrefs(p.patient?.privacy_preferences || {});
  }
  useEffect(() => { load().catch(e => setError(e.message)); }, []);

  async function save(e: FormEvent) {
    e.preventDefault(); setError(''); setMessage(''); setSaving(true);
    try { await fetchAPI('/auth/me', { method: 'PATCH', body: JSON.stringify({...form, notification_preferences: notificationPrefs, privacy_preferences: privacyPrefs}) }); await load(); setMessage('Your contact and preference details were saved.'); }
    catch (e: any) { setError(e.message); } finally { setSaving(false); }
  }
  async function requestIdentity(e: FormEvent) {
    e.preventDefault(); setError(''); setMessage('');
    try { await fetchAPI('/identity-corrections', { method: 'POST', body: JSON.stringify({ organization_code: orgCode, field_name: identityField, believed_correct: identityValue, reason }) }); setIdentityValue(''); setReason(''); setMessage('Identity correction request sent to the organization for review.'); }
    catch (e: any) { setError(e.message); }
  }
  if (!profile) return <div className="p-8 text-slate-500">Loading profile…</div>;
  const p = profile.patient || {};
  return <div className="mx-auto max-w-3xl space-y-6">
    <header><p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">Account</p><h1 className="mt-1 text-3xl font-bold">My Profile</h1><p className="mt-2 text-slate-600">Update your contact information and preferences. Clinical identity details require review.</p></header>
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-rose-800">{error}</p>}{message && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-emerald-900">{message}</p>}
    <form onSubmit={save} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-semibold">Contact and preferences</h2><div className="grid gap-4 sm:grid-cols-2">
      {([['phone','Phone'],['email','Email'],['emergency','Emergency contact'],['address','Street address'],['city','City'],['state','State'],['language','Preferred language'],['preferred_hospital','Preferred hospital'],['profile_photo_url','Profile photo URL']] as const).map(([key,label])=><label key={key} className="block text-sm font-medium">{label}<input type={key==='email'?'email':'text'} value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"/></label>)}
    </div><h3 className="pt-2 font-semibold">Notifications</h3>{['care_updates','sharing_activity','reminders'].map(key=><label key={key} className="mr-5 inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={notificationPrefs[key] !== false} onChange={e=>setNotificationPrefs({...notificationPrefs,[key]:e.target.checked})}/>{key.replace('_',' ')}</label>)}<h3 className="pt-2 font-semibold">Temporary share privacy</h3>{['share_date_of_birth','share_blood_group'].map(key=><label key={key} className="mr-5 inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={privacyPrefs[key] !== false} onChange={e=>setPrivacyPrefs({...privacyPrefs,[key]:e.target.checked})}/>{key.replaceAll('_',' ')}</label>)}<button disabled={saving} className="block rounded-lg bg-emerald-800 px-4 py-2.5 font-semibold text-white disabled:opacity-50">{saving?'Saving…':'Save profile'}</button></form>
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div><h2 className="text-lg font-semibold">Identity details</h2><p className="mt-1 text-sm text-slate-600">Name, date of birth, and sex are locked. Submit a correction for hospital administrator review.</p></div><dl className="grid gap-3 sm:grid-cols-2">{[['Name',profile.user.name],['Date of birth',p.dob],['Sex',p.sex],['Blood group',p.blood_group],['ABHA number',p.abha_number]].map(([k,v])=><div key={k}><dt className="text-xs text-slate-500">{k}</dt><dd className="font-medium">{v||'Not recorded'}</dd></div>)}</dl>
      <form onSubmit={requestIdentity} className="space-y-3 border-t border-slate-100 pt-4"><h3 className="font-semibold">Request an identity correction</h3><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-medium">Organization code<input required value={orgCode} onChange={e=>setOrgCode(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Organization reviewing request"/></label><label className="text-sm font-medium">Field<select value={identityField} onChange={e=>setIdentityField(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"><option value="name">Name</option><option value="dob">Date of birth</option><option value="sex">Sex</option></select></label></div><label className="block text-sm font-medium">Correct value<input required value={identityValue} onChange={e=>setIdentityValue(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"/></label><label className="block text-sm font-medium">Reason<textarea required value={reason} onChange={e=>setReason(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" rows={2}/></label><button className="rounded-lg border border-emerald-700 px-4 py-2 font-semibold text-emerald-800">Submit identity correction</button></form>
    </section>
  </div>;
}
