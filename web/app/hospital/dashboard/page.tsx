"use client";

import { useEffect, useState } from "react";
import { fetchAPI } from "@/lib/api";

export default function HospitalDashboard() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchAPI('/me').then(res => {
      if (res && res.user) {
        setUser(res.user);
      }
    });
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-800">Hospital Staff Portal</h1>
      <p className="mt-2 text-slate-600">Welcome, {user?.name}.</p>
      <div className="mt-8 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-700">Recent Patients</h2>
        <p className="text-sm text-slate-500 mt-2">No patients assigned yet.</p>
      </div>
    </div>
  );
}
