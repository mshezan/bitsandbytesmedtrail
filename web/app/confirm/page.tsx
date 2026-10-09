"use client";

import { useEffect, useState } from "react";
import { fetchAPI } from "@/lib/api";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle } from "lucide-react";

type RecordItem = {
  id: string;
  type: string;
  fhir: any;
  source_name: string;
  recorded_date: string;
  verified: boolean;
};

export default function ConfirmPage() {
  const router = useRouter();
  const [unverified, setUnverified] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAPI("/records?verified=false")
      .then(setUnverified)
      .finally(() => setLoading(false));
  }, []);

  async function handleApprove(id: string) {
    try {
      await fetchAPI(`/records/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ verified: true })
      });
      setUnverified(prev => prev.filter(r => r.id !== id));
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  }

  async function handleDiscard(id: string) {
    try {
      await fetchAPI(`/records/${id}`, {
        method: "DELETE"
      });
      setUnverified(prev => prev.filter(r => r.id !== id));
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-sage border-t-transparent" />
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-10 flex items-center gap-4">
        <button
          onClick={() => router.push("/timeline")}
          className="rounded-full bg-neutral-100 p-2 text-neutral-500 hover:bg-neutral-200"
        >
          &larr; Back
        </button>
        <div>
          <h1 className="text-3xl font-semibold">Review Extracted Data</h1>
          <p className="mt-1 text-neutral-500">Please confirm these records found in your upload.</p>
        </div>
      </header>

      {unverified.length === 0 ? (
        <div className="rounded-3xl border border-neutral-200 bg-white p-12 text-center shadow-sm">
          <CheckCircle className="mx-auto mb-4 h-12 w-12 text-sage" />
          <h2 className="text-xl font-semibold">All Caught Up!</h2>
          <p className="text-neutral-500">No unverified records to review.</p>
          <button 
            onClick={() => router.push("/timeline")}
            className="mt-6 rounded-xl bg-sage px-6 py-3 font-medium text-white hover:bg-sage/90"
          >
            Go to Timeline
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {unverified.map(r => (
            <div key={r.id} className="flex flex-col justify-between gap-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm md:flex-row md:items-center">
              <div>
                <span className="mb-2 inline-block rounded-full bg-mist px-3 py-1 text-xs font-medium text-sage uppercase tracking-wider">
                  {r.type}
                </span>
                <h3 className="font-semibold text-neutral-900">
                  {r.type === "condition" && r.fhir.code?.text}
                  {r.type === "medication" && r.fhir.medicationCodeableConcept?.text}
                  {r.type === "observation" && r.fhir.code?.text}
                  {r.type === "allergy" && r.fhir.code?.text}
                </h3>
                {r.type === "observation" && r.fhir.valueQuantity && (
                  <p className="text-sm text-neutral-500 mt-1">
                    Value: {r.fhir.valueQuantity.value} {r.fhir.valueQuantity.unit}
                  </p>
                )}
                {r.type === "medication" && r.fhir.dosageInstruction?.[0]?.text && (
                  <p className="text-sm text-neutral-500 mt-1">
                    Dose: {r.fhir.dosageInstruction[0].text}
                  </p>
                )}
                <p className="mt-2 text-xs text-neutral-400">Date: {r.recorded_date} • Source: {r.source_name}</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleDiscard(r.id)}
                  className="flex items-center gap-2 rounded-xl border border-neutral-200 px-4 py-2 font-medium text-red-600 hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4" /> Discard
                </button>
                <button 
                  onClick={() => handleApprove(r.id)}
                  className="flex items-center gap-2 rounded-xl bg-sage px-4 py-2 font-medium text-white hover:bg-sage/90"
                >
                  <CheckCircle className="h-4 w-4" /> Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
