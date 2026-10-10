"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchAPI } from "@/lib/api";
import { QRCodeSVG } from "qrcode.react";

export default function EmergencyQRPage() {
  const router = useRouter();
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    try {
      const res = await fetchAPI("/emergency", { method: "POST" });
      setUrl(res.url);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRevoke() {
    try {
      await fetchAPI("/emergency/revoke", { method: "POST" });
      setUrl(null);
    } catch (err: any) {
      alert(err.message);
    }
  }

  return (
    <main className="mx-auto max-w-md px-6 py-12 text-center">
      <header className="mb-10 flex items-center justify-between">
        <button onClick={() => router.push("/patient/home")} className="rounded-full bg-neutral-100 p-2 text-neutral-500 hover:bg-neutral-200">
          &larr; Back
        </button>
      </header>

      <h1 className="mb-2 text-3xl font-bold text-red-600">Emergency Card</h1>
      <p className="mb-8 text-neutral-500">
        Generate a secure QR code for ER staff to scan. It provides instant access to your blood type, allergies, conditions, and emergency contact.
      </p>

      {url ? (
        <div className="flex flex-col items-center">
          <div className="rounded-3xl border-4 border-red-100 bg-white p-6 shadow-lg">
            <QRCodeSVG value={url} size={256} />
          </div>
          <p className="mt-6 text-sm text-neutral-500">Scan with any smartphone camera.</p>
          <button 
            onClick={() => setUrl(null)}
            className="mt-6 rounded-xl border border-neutral-200 px-6 py-3 font-medium text-neutral-700 hover:bg-neutral-100"
          >
            Hide QR Code
          </button>
          <button onClick={handleRevoke} className="mt-3 text-sm font-medium text-red-700 underline">Revoke this card</button>
        </div>
      ) : (
        <button 
          onClick={handleGenerate}
          disabled={loading}
          className="w-full rounded-2xl bg-red-600 py-4 text-lg font-medium text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate QR Code"}
        </button>
      )}
    </main>
  );
}
