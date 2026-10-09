'use client';
import { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';

export default function Profile() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchAPI('/me').then(res => {
      if (res && res.user) setUser(res);
    });
  }, []);

  if (!user) return <div className="p-8 text-slate-500">Loading profile...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <div className="space-y-4">
           <div><label className="text-xs text-slate-500">Name</label><div className="font-medium text-slate-800">{user.user.name}</div></div>
           <div><label className="text-xs text-slate-500">Phone</label><div className="font-medium text-slate-800">{user.user.phone}</div></div>
           {user.patient && (
             <>
               <div><label className="text-xs text-slate-500">Blood Group</label><div className="font-medium text-slate-800">{user.patient.blood_group}</div></div>
               <div><label className="text-xs text-slate-500">Emergency Contact</label><div className="font-medium text-slate-800">{user.patient.emergency}</div></div>
             </>
           )}
        </div>
      </div>
    </div>
  );
}
