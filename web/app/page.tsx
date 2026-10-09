"use client";

import { useEffect, useState } from "react";

type Status = {
  demo_mode: boolean;
  notice: string;
  users: number;
  patients: number;
  records: number;
  verified_records: number;
};

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function HomePage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API}/demo/status`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Could not reach the API");
        setStatus(await res.json());
      })
      .catch(() => setError("The API is not reachable yet. Wait for docker compose to finish starting."));
  }, []);

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-8 px-6 py-10">
      <div className="rounded-full bg-amber-100 px-4 py-2 text-center text-sm font-medium text-amber-950">
        Demo data, not medical advice
      </div>

      <header className="space-y-3">
        <p className="text-sm uppercase tracking-[0.2em] text-sage">MedTrail</p>
        <h1 className="text-4xl font-semibold leading-tight">Your records, one calm timeline.</h1>
        <p className="text-lg text-neutral-600">
          Step 1 is live: database, migrations, object storage, and seeded synthetic patients.
        </p>
      </header>

      {!status && !error && (
        <div className="space-y-3" aria-busy="true">
          <div className="h-24 animate-pulse rounded-2xl bg-white/80" />
          <div className="h-24 animate-pulse rounded-2xl bg-white/80" />
        </div>
      )}

      {error && (
        <p className="rounded-2xl border border-red-200 bg-white px-5 py-4 text-red-800">{error}</p>
      )}

      {status && (
        <section className="grid grid-cols-2 gap-3">
          <Stat label="Patients" value={status.patients} />
          <Stat label="Records" value={status.records} />
          <Stat label="Verified" value={status.verified_records} />
          <Stat label="Users" value={status.users} />
        </section>
      )}

      <div className="mt-4 flex gap-4">
        <a href="/login" className="rounded-xl bg-sage px-6 py-3 font-medium text-white hover:bg-sage/90">
          Sign In to MedTrail
        </a>
      </div>

      <p className="text-sm text-neutral-500">
        Login, timeline, and sharing come in later steps. OpenAPI lives at{" "}
        <a className="text-sage underline" href={`${API}/docs`}>
          /docs
        </a>
        .
      </p>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white px-5 py-6 shadow-sm">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}
